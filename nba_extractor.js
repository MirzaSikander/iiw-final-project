var fs = require('fs');
var scraped_data_dir = './scraped-data';
var extracted_data_dir = './extracted-data'
fs.readdir(scraped_data_dir, readdir)
var currentRow;

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
        console.log('\nLine number:' + currentRow + '\nData: ' + raw_score);
        throw err;
    }

}

function parseShotMade(raw_txt, metrics) {
    try {
        if (raw_txt.search(/Free Throw/) != -1) {
            var array = raw_txt.match(/^(.*) Free Throw (Technical)?(?:(\d) of (\d))?/)
            metrics.eventtype = 'free throw';
            metrics.player = array[1];
            metrics.reason = array[2] || 'foul';
            metrics.numfreeshot = array[3] || '';
            metrics.outof = array[4] || '';
        } else {
            var array = raw_txt.match(/^(.*) (?:(\d+)')? (.*) \(\d+ PTS\)(?: \((.*) \d )?/);
            metrics.eventtype = 'shot'
            metrics.player = array[1];
            metrics.shotdistance = array[2] || '';
            metrics.type = array[3];
            metrics.assist = array[5] || '';
        }
        isConsistent(metrics);
    } catch (err) {
        console.log('\nLine number:' + currentRow + '\nData: ' + raw_txt);
        throw err;
    }
}

function readdir(err, files) {
    if (err) {
        console.log(err);
        return;
    }
    for (var i = 0; i < files.length; i++) {
        var file = scraped_data_dir + '/' + files[i];
        var errFile = [];
        fs.readFile(file, readFile);
    }
}

function readFile(err, data) {
    if (err) {
        errFile.push(file);
        console.log(err);
        return;
    }
    var lines = data.toString().split("\n");
    var previous_score = {
        away: "0",
        home: "0"
    };
    var extracted_data = "a1, a2, a3, a4, a5, h1, h2, h3, h4, h5, quarter, time, team, eventtype, assist, awayjumpball, block, entered, homejumpball, left, numfreeshot, opponent, outof, player, points, possession, reason, result, steal, type, x, y, score, shotdistance \n";
    for (var j = 1; j < lines.length; j++) {
        if(lines[j] == ""){
            console.log("\nSkipped line "+currentRow+"\n\n");
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
        parseScore(columns[1], metrics, previous_score);
        if (metrics.away_score != '') {
            parseShotMade(columns[3], metrics)
        }

        var extracted_columns = new Array(34);
        extracted_columns[10] = columns[0]; //quarter
        extracted_columns[11] = columns[4]; //time;
        extracted_columns[12] = columns[2]; //team
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

        extracted_columns[31] = metrics.shotdistance;
        var newline = extracted_columns.join();
        console.log(newline);
        extracted_data += newline
    };


}
