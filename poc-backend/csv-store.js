const stream = require("node:stream");
const { parse } = require('@fast-csv/parse');
const {writeToStream } = require('@fast-csv/format')
const { DataStore, ERRORS } = require("@tus/server")
const fs = require('fs')
const path = require('path')
const IGNORED_MKDIR_ERROR = 'EEXIST'
const MASK = '0777'

class CSVStore extends DataStore {

    constructor({ db, rowSize }) {
        super()
        this.directory = 'error_csv_files'
        this.db = db
        this.rowSize = rowSize
        this.checkOrCreateDirectory()
    }

    checkOrCreateDirectory() {
        fs.mkdir(this.directory, MASK, (error) => {
            if (error && error.code !== IGNORED_MKDIR_ERROR) {
                throw error
            }
        })
    }


    create(file) {
        return new Promise((resolve, reject) => {
            fs.open(path.join(this.directory, file.id), 'w', (err, fd) => {
                if (err) {
                    console.log('[CSVStore] create: Error creating error csv file ', err)
                    return reject(err)
                }
                return fs.close(fd, (exception) => {
                    if (exception) {
                        console.log('[CSVStore] create: Error', exception)
                        return reject(exception)
                    }

                    return resolve(file)
                })
            })
        })
    }

    rowValidator(row) {
        if (!row['Email']) return false;
        if (!row['Last_Name']) return false;
        if (!row['First_Name']) return false;
        if (!!row['Guardian_Email']) {
            return !!row['Guardian_Last_Name'] && !!row['Guardian_First_Name']
        }
        if (!!row['Guardian2_Email']) {
            return !!row['Guardian2_Last_Name'] && !!row['Guardian2_First_Name']
        }
        return true
    }

    bulkInsertToDb(rows, file_id) {
        this.db.serialize(() => {
            this.db.run('begin transaction')
            for (const row of rows) {
                this.db.run("insert into Users ('School_ID', 'DCID', 'Last_Name','First_Name', 'Email', 'Grade_Level', 'Student_ID', 'Guardian_Email', 'Guardian_Last_Name','Guardian_First_Name','Guardian2_Email', 'Guardian2_Last_Name', 'Guardian2_First_Name', 'file_id') values (?, ?, ?,?,?,?,?,?,?,?,?,?,?,?)",
                    row['School_ID'], row['DCID'], row['Last_Name'], row['First_Name'], row['Email'], row['Grade_Level'], row['Student_ID'],
                    row['Guardian_Email'], row['Guardian_Last_Name'], row['Guardian_First_Name'], row['Guardian2_Email'], row['Guardian2_Last_Name'],
                    row['Guardian2_First_Name'], file_id
                )
            }
            this.db.run('commit')
        })
    }

    insertErrorRows(rows, stream){
        writeToStream(stream, rows);
    }

    write(
        readable,
        file_id,
        offset
    ) {
        const file_path = path.join(this.directory, file_id)
        const error_writeable = fs.createWriteStream(file_path, {flags:'a'})

        let _this = this
        let validRows = []
        let invalidRows = []
        const writeable = parse({ headers: true })
            .on("data", function (row) {
                if (_this.rowValidator(row)) {
                    validRows.push(row)
                }
                else {
                    invalidRows.push(row)
                }
                if (validRows.length === _this.rowSize) {
                    _this.bulkInsertToDb(validRows, file_id)
                    validRows = []
                }
                if (invalidRows.length === _this.rowSize) {
                    _this.insertErrorRows(invalidRows, error_writeable)
                    invalidRows = []
                }
            })
            .on('end', () => {
                if (validRows.length > 0) {
                    _this.bulkInsertToDb(validRows, file_id)
                    validRows = []
                }
                if (invalidRows.length > 0) {                    
                    _this.insertErrorRows(invalidRows, error_writeable)
                    invalidRows = []
                }
            })

        let bytes_received = 0

        const transform = new stream.Transform({
            transform(chunk, _, callback) {
                bytes_received += chunk.length
                callback(null, chunk)
            },
        })

        return new Promise((resolve, reject) => {
            stream.pipeline(readable, transform, writeable, (err) => {

                if (err) {
                    console.log('[CSVStore] write: Error', err)
                    return reject(ERRORS.FILE_WRITE_ERROR)
                }

                console.log(`[CSVStore] write: ${bytes_received} bytes written`)
                offset += bytes_received
                console.log(`[CSVStore] write: File is now ${offset} bytes`)

                return resolve(offset)
            })
        })
    }
}
module.exports = CSVStore