import fs from 'fs'

export default function readFirstLine(file) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file, {encoding: 'utf8'})

    let buffer = ''
    stream
      .on('data', data => {
        const newlineAt = data.indexOf('\n')
        buffer += newlineAt === -1 ? data : data.substr(0, newlineAt)
        if (newlineAt === -1) {
          return
        }

        // Close the file stream, since we don't need the rest of the file
        stream.destroy()
        resolve(buffer)
      })
      // We only want to reject on the first error, since stream errors might occur multiple times
      .once('error', reject)
      // In the rare case where the file is only a single line with no trailing newline
      .on('end', () => resolve(buffer))
  })
}
