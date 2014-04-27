var fs = require('graceful-fs');
var scraped_data_dir = './scraped-data/nba';
var extracted_data_dir = './extracted-data/nba'
fs.readdir(scraped_data_dir, readdir)
var currentRow;
var currentFile;

function isConsistent(metrics) {
    for (property in metrics) {
        var metric = metrics[property];
        if (typeof metric == 'undefined') {
            throw new Error(property + '=' + metric);
        }
    }
}

function parseScore(raw_score, metrics, previous_score) {
    try {
        var array = raw_score.match(/\[ (\d+) \- (\d+) \]/);
        if (array != null) {
            metrics.home_score = array[1];
            metrics.away_score = array[2];
            var result;
            if ((result = metrics.home_score - previous_score.home) != 0) {
                metrics.points = result;
            } else {
                metrics.points = metrics.away_score - previous_score.away;
            }
            if (metrics.points == 0) {
                throw new Error();
            }
        }
        isConsistent(metrics);
    } catch (err) {
        console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_score);
        throw err;
    }

}

function parseShotDetail(raw_txt, metrics) {
    try {
        if (raw_txt.search(/Free Throw/) != -1) {
            var array = raw_txt.match(/^(.*) Free Throw (Technical)?(?:(\d) of (\d))?/)
            metrics.eventtype = 'free throw';
            metrics.player = array[1];
            metrics.reason = array[2] || 'foul';
            metrics.numfreeshot = array[3] || '';
            metrics.outof = array[4] || '';
        } else {
            var array = raw_txt.match(/^(.*) (?:(\d+)')? (?:(.*) \(\d+ PTS\)(?: \((.*) \d )?|(.*))/);
            metrics.eventtype = 'shot'
            metrics.player = array[1];
            metrics.shotdistance = array[2] || '';
            metrics.type = array[3] || array[5];
            metrics.assist = array[4] || '';
        }
        isConsistent(metrics);
    } catch (err) {
        console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
        throw err;
    }
}

function parseShotMade(raw_txt, metrics) {
    parseShotDetail(raw_txt, metrics);
    metrics.result = 'made';
}

function parseOtherEvents(raw_txt, metrics) {
    if (raw_txt.search(/Jump Ball (.*) vs. (.*)/) != -1) {
        try {
            var array = raw_txt.match(/^Jump Ball (.*) vs. (.*):/);
            metrics.eventtype = 'jumpball';
            metrics.homejumpball = array[1];
            metrics.awayjumpball = array[2];
            isConsistent(metrics);
        } catch (err) {
            console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
            throw err;
        }
    } else if (raw_txt.search(/MISS/) != -1) {
        var array = raw_txt.match(/^MISS (.*)/);
        parseShotDetail(array[1], metrics);
        metrics.result = 'missed';
    } else if (raw_txt.search(/Free Throw/) != -1) {
        parseShotDetail('NULL ' + raw_txt, metrics);
        metrics.result = 'missed';
    } else if (raw_txt.search(/REBOUND|Rebound/) != -1) {
        try {
            var array = raw_txt.match(/(.*) (REBOUND|Rebound)/);
            metrics.eventtype = 'rebound';
            if (array[2] == 'REBOUND') {
                metrics.player = array[1];
            }
        } catch (err) {
            console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
            throw err;
        }
    } else if (raw_txt.search(/Turnover/) != -1) {
        try {
            var array = raw_txt.match(/^(.*) (?:(Bad Pass|Out of Bounds Lost Ball|Out Of Bounds|Poss Lost Ball|Lost Ball|Traveling|Foul|(?:3 Second |Jump Ball |Lane |Kicked Ball |5 Second )Violation|Offensive Goaltending|Step Out of Bounds|Palming|Discontinue Dribble|Backcourt|Inbound|Illegal Screen|Double Dribble|Opposite Basket|No|Illegal Assist|Swinging Elbows|Double Personal) Turnover|Turnover: (.*) \()/);
            metrics.eventtype = 'turnover';
            if (typeof array[2] == 'undefined') {
                metrics.reason = array[3];
            } else {
                metrics.player = array[1];
                metrics.reason = array[2];
            }
            isConsistent(metrics);
        } catch (err) {
            console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
            throw err;
        }
    } else if (raw_txt.search(/FOUL/) != -1) {
        try {
            var array = raw_txt.match(/(.*) (\S+)\.FOUL/);
            metrics.eventtype = 'foul';
            metrics.player = array[1];
            if (array[2] == 'P') {
                metrics.type = 'Personal';
            } else if (array[2] == 'S') {
                metrics.type = 'Shooting';
            } else if (array[2] == 'T') {
                metrics.type = 'Technical';
            } else if (array[2] == 'L.B') {
                metrics.type = 'Loose ball';
            } else if (array[2] == 'FLAGRANT') {
                metrics.type = 'Flagrant';
            } else if (array[2] == 'AWAY.FROM.PLAY') {
                metrics.type = 'away from play';
            } else if (array[2] == 'C.P') {
                metrics.type = 'clear path';
            } else if (array[2] == 'IN') {
                metrics.type = 'Inbound';
            } else if (array[2] == 'HANGING.TECH') {
                metrics.type = 'Hanging Tech';
            } else if (array[2] == 'PUNCH') {
                metrics.type = 'Punching';
            } else {
                throw new Error();
            }
            isConsistent(metrics);
        } catch (err) {
            console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
            throw err;
        }
    } else if (raw_txt.search(/Foul/) != -1) {
        try {
            var array = raw_txt.match(/^(\S+) (?:(.*) Foul|(.*)\.Foul|Foul)/);
            metrics.eventtype = 'foul';
            if (typeof array[2] != 'undefined') {
                metrics.player = array[1];
                if (typeof array[3] != 'undefined') {
                    if (array[3] == 'OFF') {
                        metrics.type = 'Offensive';
                    }
                } else {
                    metrics.type = array[2];
                }
            }
            isConsistent(metrics);
        } catch (err) {
            console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
            throw err;
        }

    } else if (raw_txt.search(/SUB/) != -1) {
        try {
            var array = raw_txt.match(/SUB: (.*) FOR (.*)/);
            metrics.eventtype = 'substitute';
            metrics.entered = array[1];
            metrics.left = array[2];
            isConsistent(metrics);
        } catch (err) {
            console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
            throw err;
        }
        // } else if (raw_txt.search(/STEAL/) != -1) {
        //     try {
        //         var array = raw_txt.match(/(\S+) STEAL/);
        //         metrics.steal = array[1];
        //     } catch (err) {
        //         console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
        //         throw err;
        //     }
        // } else if (raw_txt.search(/BLOCK/) != -1) {
        //     try {
        //         var array = raw_txt.match(/(\S+) BLOCK/);
        //         metrics.block = array[1];
        //     } catch (err) {
        //         console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
        //         throw err;
        //     }
    } else if (raw_txt.search(/Violation/) != -1) {
        try {
            var array = raw_txt.match(/(.*) Violation:(.*)/);
            metrics.eventtype = "violation";
            metrics.player = array[1];
            metrics.reason = array[2];
        } catch (err) {
            console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
            throw err;
        }
    } else if (raw_txt.search(/Ejection/) != -1) {
        try {
            var array = raw_txt.match(/(.*) Ejection:(.*)/);
            metrics.eventtype = "ejection";
            metrics.player = array[1];
            metrics.reason = array[2];
        } catch (err) {
            console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
            throw err;
        }
    } else if (raw_txt.search(/Taunting/) != -1) {
        try {
            var array = raw_txt.match(/(.*) Taunting/);
            metrics.eventtype = "foul";
            metrics.player = array[1];
            metrics.type = 'Taunting technical';
        } catch (err) {
            console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
            throw err;
        }
    } else if (raw_txt.search(/Non-Unsportsmanlike/) != -1) {
        try {
            var array = raw_txt.match(/(.*) Non-Unsportsmanlike/);
            metrics.eventtype = "foul";
            metrics.player = array[1];
            metrics.type = 'Non unsport tech';
        } catch (err) {
            console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
            throw err;
        }

    } else if (raw_txt.search(/Timeout/) != -1) {
        metrics.eventtype = 'timeout';
    } else if(raw_txt.search(/Pacers/) != -1){

    } else {
        console.log('\nFile:' + currentFile + '\nLine number:' + currentRow + '\nData: ' + raw_txt);
        throw new Error();
    }
}

// function unfold(rows, result){
//     if(rows.length == 1){
//         result.push(rows[0]);
//     }else{
//         for(var i = 0; )
//     }
// }

function readdir(err, files) {
    if (err) {
        console.log(err);
        return;
    }
    for (var i = 0; i < files.length; i++) {
        var file = scraped_data_dir + '/' + files[i];
        if (file.search(/.DS_Store/) != -1) {
            continue;
        }
        var data = fs.readFileSync(file);

        currentFile = file;
        var lines = data.toString().split("\n");
        var previous_score = {
            away: "0",
            home: "0"
        };
        var temp_storage = {
            time: "",

        }
        var extracted_data = "a1, a2, a3, a4, a5, h1, h2, h3, h4, h5, quarter, time, team, eventtype, assist, awayjumpball, block, entered, homejumpball, left, numfreeshot, opponent, outof, player, points, possession, reason, result, steal, type, x, y, score, shotdistance, url \n";
        //var extracted_data = [];
        for (var j = 1; j < lines.length; j++) {
            if (lines[j] == "") {
                console.log("\nSkipped line " + currentRow + "\n\n");
                continue;
            }
            currentRow = j; //for debugging 
            var line = lines[j];
            var columns = line.split(",");
            var metrics = {
                away_score: '',
                home_score: '',
                eventtype: '',
                assist: '',
                awayjumpball: '',
                block: '',
                entered: '',
                homejumpball: '',
                left: '',
                numfreeshot: '',
                opponent: '',
                outof: '',
                player: '',
                points: '',
                possession: '',
                reason: '',
                result: '',
                steal: '',
                shotdistance: ''
            };

            if (columns[4].search(/BLOCK/) != -1 || columns[4].search(/STEAL/) != -1) {
                continue;
            }

            parseScore(columns[2], metrics, previous_score);
            if (metrics.away_score != '') {
                parseShotMade(columns[4], metrics)
            } else {
                parseOtherEvents(columns[4], metrics);
            }
            var extracted_columns = [];
            for (var k = 0; k < 10; k++) {
                extracted_columns[i] = "";
            }
            extracted_columns[10] = columns[1]; //quarter
            extracted_columns[11] = columns[5].replace(/(\r\n|\n|\r)/gm, "").replace(/(\d\d?):(\d\d)/, "$1.$2"); //time;
            extracted_columns[12] = columns[3]; //team
            extracted_columns[13] = metrics.eventtype;
            extracted_columns[14] = metrics.assist;
            extracted_columns[15] = metrics.awayjumpball;
            extracted_columns[16] = metrics.block;
            extracted_columns[17] = metrics.entered;
            extracted_columns[18] = metrics.homejumpball;
            extracted_columns[19] = metrics.left;
            extracted_columns[20] = metrics.numfreeshot;
            extracted_columns[21] = metrics.opponent;
            extracted_columns[22] = metrics.outof;
            extracted_columns[23] = metrics.player;
            extracted_columns[24] = metrics.points;
            extracted_columns[25] = metrics.possession;
            extracted_columns[26] = metrics.reason;
            extracted_columns[27] = metrics.result;
            extracted_columns[28] = metrics.steal;
            extracted_columns[29] = metrics.type;
            extracted_columns[30] = "";
            extracted_columns[31] = "";

            if (metrics.away_score == '') {
                if (previous_score.home == '0' && previous_score.away == '0') {
                    extracted_columns[32] = "";
                } else {
                    extracted_columns[32] = previous_score.home + '-' + previous_score.away;
                }
            } else {
                extracted_columns[32] = metrics.home_score + '-' + metrics.away_score;
                previous_score.away = metrics.away_score;
                previous_score.home = metrics.home_score;
            }

            extracted_columns[33] = metrics.shotdistance;
            extracted_columns[34] = columns[0];
            var newline = "";
            for (var k = 0; k < 34; k++) {
                if (typeof extracted_columns[k] == 'undefined')
                    newline += ',';
                else
                    newline += extracted_columns[k] + ',';
            }
            newline += extracted_columns[k] + '\n';
            console.log(newline);
            extracted_data += newline;
            //extracted_data.push(extracted_columns);
        };

        // var rows_w_same_time = [];
        // var current_time = null;
        // var current_quarter = null;
        // var result[];
        // for (var j = 0; j < extracted_data.length; j++) {
        //    var row = extracted_data[j]; 
        //    if (row[10] == current_quarter && row[11] == current_time){
        //         rows_w_same_time.push(row);
        //    }else{
        //         unfold(rows_w_same_time, result);
        //         rows_w_same_time = [];
        //         rows_w_same_time.push(row);
        //         current_quarter = row[10];
        //         current_time = row[11];
        //    }
        // }
        var output_file = extracted_data_dir + '/' + file.replace(/.*\w\/(.*)-raw.csv/, "$1-ex.csv");
        fs.writeFileSync(output_file, extracted_data);
        console.log(output_file + " was saved");
    }
}
