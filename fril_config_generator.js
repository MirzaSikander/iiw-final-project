var fs = require('graceful-fs');
var xmlToDom = require('libxmljs');
var extracted_data_dir = './extracted-data/br';
var fril_config_dir = './fril-configs'
var main_config_file = './project.xml';
fs.readdir(extracted_data_dir, readdir)

function readdir(err, files) {

    if (err) {
        console.log(err);
        return;
    }
    var configFileDump = fs.readFileSync(main_config_file);
    //var configFileDump = '<?xml version="1.0" encoding="UTF-8"?><results-savers> <results-saver class="cdc.impl.resultsavers.DeduplicatingResultsSaver"> <params> <param name="deduplication" value="both"/> <param name="delete-duplicates" value="true"/> </params> <savers> <results-saver class="cdc.impl.resultsavers.CSVFileSaver"> <params> <param name="output-file" value="/Users/mirzasikander/Documents/courses/CS548-IIW/Project/code/linked-data/201210300CLE/results.csv"/> </params> </results-saver> </savers> </results-saver> </results-savers>';
    for (var i = 0; i < files.length; i++) {
        var fileName = files[i];
        if (fileName == '.DS_Store') {
            continue;
        }
        (function(fileName) {
            var leftFileName = fileName;
            var rightFileName = fileName.replace(/(\d+)0(\w\w\w).csv/, "nba-$1$2-ex.csv");
            var outDirName = fileName.replace(/(.*).csv/, "$1");
            var configFileName = fril_config_dir + '/' + outDirName + "-config.xml";
            var xmlRep = xmlToDom.parseXmlString(configFileDump.toString());
            // example: Users/mirzasikander/Documents/courses/CS548-IIW/Project/code/linked-data/201210300CLE/linked-201210300CLE.csv
            var results_saver = xmlRep.get('//param[@name="output-file"]');
            var new_path = results_saver.attr('value').value().replace(/(.*\/).*\/results.csv/, "$1" + outDirName + '/linked-' + fileName);
            results_saver.attr({
                'value': new_path
            });
            //fix the script tags
            // var scriptTags = data.$('param[name="script"]').each(function(){
            //     var value = $(this).attr('value');
            //     $(this).attr('value', value.replace(/\r?\n|\r/g,'&#xa;'));
            // });
            // console.log(scriptTags.length);

            var left_source = xmlRep.get('//left-data-source//param[@name="input-file"]');
            new_path = left_source.attr('value').value().replace(/(.*\/).*.csv/, "$1" + leftFileName);
            left_source.attr({
                'value': new_path
            });

            var right_source = xmlRep.get('//right-data-source//param[@name="input-file"]');
            new_path = right_source.attr('value').value().replace(/(.*\/).*.csv/, "$1" + rightFileName);
            right_source.attr({
                'value': new_path
            });
            //var results_saver = data.$('results-saver param[name="output-file"]');
            // results_saver.attr('value',
            //     results_saver.attr('value')
            //     .replace(/(.*\/).*\/results.csv/, "$1" + outDirName + '/linked-' + fileName));

            // console.log(xmlRep.toString());
            fs.writeFile(configFileName, xmlRep.toString(), function(err) {
                if (err) throw err;
                console.log(configFileName);
                fs.mkdir('./linked-data/' + outDirName, function(err) {
                    if (!err)
                        console.log('./linked-data/' + outDirName + ' created');
                });
            });
        })(fileName);
    }
}
