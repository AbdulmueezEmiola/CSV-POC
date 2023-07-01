import { parseStream } from "@fast-csv/parse"

const { DataStore } = require("@tus/server")
export class FileStore extends DataStore {
    write(
        readable,
        file_id,
        offset
    ) {
        parseStream(readable, {headers: true})
        const file_path = path.join(this.directory, file_id)
        const writeable = fs.createWriteStream(file_path, {
            flags: 'r+',
            start: offset,
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
                    log('[FileStore] write: Error', err)
                    return reject(ERRORS.FILE_WRITE_ERROR)
                }

                log(`[FileStore] write: ${bytes_received} bytes written to ${file_path}`)
                offset += bytes_received
                log(`[FileStore] write: File is now ${offset} bytes`)

                return resolve(offset)
            })
        })
    }
}