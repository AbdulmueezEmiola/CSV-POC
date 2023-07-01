const express = require("express");
const { Server } = require("@tus/server");
const { FileStore } = require("@tus/file-store");
const fs = require("fs");
const { parseStream } = require('@fast-csv/parse');
const db = require('./db.js')

const uploadApp = express();
const app = express();
const PORT = 3001;
let exec = require("child_process").exec;


function bulkInsertToDb(rows){  
  db.run('begin transaction')
  for(const row of rows){
    db.run("insert into Users ('School_ID', 'DCID', 'Last_Name','First_Name', 'Email', 'Grade_Level', 'Student_ID', 'Guardian_Email', 'Guardian_Last_Name','Guardian_First_Name','Guardian2_Email', 'Guardian2_Last_Name', 'Guardian2_First_Name') values (?, ?, ?,?,?,?,?,?,?,?,?,?,?)", 
    row['School_ID'], row['DCID'], row['Last_Name'], row['First_Name'], row['Email'], row['Grade_Level'], row['Student_ID'],
    row['Guardian_Email'], row['Guardian_Last_Name'], row['Guardian_First_Name'], row['Guardian2_Email'], row['Guardian2_Last_Name'], 
    row['Guardian2_First_Name']
    )
  }
  db.run('commit')
}

function rowValidator(row){
  if(!row['Email']) return false;
  if(!row['Last_Name']) return false;
  if(!row['First_Name']) return false;
  if(!!row['Guardian_Email']){
    return !!row['Guardian_Last_Name'] && !!row['Guardian_First_Name']
  }
  if(!!row['Guardian2_Email']){
    return !!row['Guardian2_Last_Name'] && !!row['Guardian2_First_Name']
  }
  return true
}

const server = new Server({
  path: "/files",
  datastore: new FileStore({ directory: "./files" }),
  onUploadFinish: (req, res, upload) => {
    let validRows = []
    let invalidRows = []
    const stream = fs.createReadStream(`./files/${upload.id}`)
    parseStream(stream, {headers: true})
      .on("data", function (row) {
          if(rowValidator(row)){
            validRows.push(row)
          }
          else{
            invalidRows.push(row)
          }
          if(validRows.length === 1000){
            bulkInsertToDb(validRows)
            validRows = []
          }
          if(invalidRows.length === 1000){
            invalidRows = []
          }
      })
      .on('end', () => {
        if(validRows.length > 0){
          bulkInsertToDb(validRows)
          validRows = []
        }
        if(invalidRows.length > 0){
          invalidRows = []
        }
      })
  },
});



uploadApp.all("*", server.handle.bind(server));
app.use("/uploads", uploadApp);

app.listen(PORT, (error) => {
  if (!error) {
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  }
  else console.log("Error occurred, server can't start", error);
});
