const sqlite3 = require("sqlite3").verbose();
const filepath = "./files.db";
const fs = require("fs");

function createDbConnection(filepath) {    
    if (fs.existsSync(filepath)) {
        const db =  new sqlite3.Database(filepath);
        db.each(`SELECT count(*) FROM Users`, (error, row) => {
            if (error) {
              throw new Error(error.message);
            }
            console.log(row);
          });
        return db
    } else {
        const db = new sqlite3.Database(filepath, (error) => {
            if (error) {
                return console.error(error.message);
            }
            createTable(db)
        });
        console.log("Connection with SQLite has been established");
        return db;
    }
}

function createTable(db) {
    db.exec(`
    CREATE TABLE Users
    (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      School_ID VARCHAR(250),
      DCID VARCHAR(250),
      Last_Name VARCHAR(250),
      First_Name VARCHAR(250),
      Email VARCHAR(250),
      Grade_Level VARCHAR(250),
      Student_ID VARCHAR(250),
      Guardian_First_Name VARCHAR(250),
      Guardian_Last_Name VARCHAR(250),
      Guardian_Email VARCHAR(250),
      Guardian2_First_Name VARCHAR(250),
      Guardian2_Last_Name VARCHAR(250),
      Guardian2_Email VARCHAR(250)
    );
  `);
}

module.exports = createDbConnection(filepath)