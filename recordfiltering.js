var fs = require('graceful-fs');
var linked_data_dir = './linked-data';
var final_data_dir = './final-data';

fs.readdir(linked_data_dir, readdir);

function readdir(err, directories) {
    if (err) {
        console.log(err);
        return;
    }
    
    for (var i = 0; i < directories.length; i++) {
    
    console.log(directories[i]);
    var current_directory = linked_data_dir + '/' + directories[i];       
    
    (function(current_directory){ 

    fs.readdir(current_directory, function (err,files){
    
    if (err) {
        console.log(err);
        return;
    }

    for (var i = 0; i < files.length; i++) {

      if(files[i].indexOf("linked-") != -1)
      {
        var file = current_directory + '/' + files[i];
        var data = fs.readFileSync(file);

        var lines = data.toString().split("\n");

        var extracted_data = [];
        var columnNames = ['quarter','time', 'eventtype', 'team', 'outof', 'numfreeshot', 'points', 'reason', 'result', 'type', 'score', 'shotdistance', 'x', 'url' , 'y', 'asssist', 'awayjumpball', 'block', 'entered', 'homejumpball', 'left', 'opponent', 'player', 'steal'];
        extracted_data.push(columnNames);

        for (var j = 1; j < lines.length-1; j++) {
            var line = lines[j];
            line = line.replace(/"/g, '');
            var columns = line.split(",");

            var extracted_columns = [];
            for(var k=0, l=0; k<33; k++)
            {
              if (k == 1)
              {
                extracted_columns[l++] = columns[k] + ":" + columns[k+1];
                k++; 
              }
              else if(k >= 15)
              {
                extracted_columns[l++] = checkColumnsNames(columns[k], columns[k+1], columns[47+((k-15)/2)]);
                k++; 
              }
              else
              {
                if(k == 13 || k == 14)
                {
                  extracted_columns[l++] = columns[k];
                  if(k == 13) 
                    extracted_columns[l++] = columns[k+33];
                }
                else
                  extracted_columns[l++] = checkColumns(columns[k], columns[k+33]);
              }   
            }

            extracted_data.push(extracted_columns);
          }
          
          var output = "";
          for (var j = 0; j < extracted_data.length; j++) {
            var currentRow = extracted_data[j];
            var newline = "";
            for (var k = 0; k < currentRow.length-1; k++) {
                if (typeof currentRow[k] == 'undefined')
                    newline += ',';
                else
                    newline += currentRow[k] + ',';
            }
            newline += currentRow[k] + '\n';
            output += newline;
        }

          var output_file = final_data_dir + '/' + current_directory.replace(/.\/linked-data\//, "") + ".csv";
          fs.writeFileSync(output_file, output);
          console.log(output_file + " was saved");
          }
        }
      });
    })(current_directory);
  }
}

function checkColumns(column_br, column_nba, flagName)
{
    if(column_br == column_nba)
      return column_nba;
    else if(column_br != column_nba)
    {
      if(column_nba != '')
        return column_nba;
      else
        return column_br;
    }
}
    
function checkColumnsNames(firstName_br, lastName_br, lastName_Nba)
{
  if(lastName_br == '' && lastName_Nba == '')
    return '';
  else if(lastName_br == lastName_Nba)
    return (firstName_br + " " + lastName_br);
  else
    return lastName_Nba;
}
