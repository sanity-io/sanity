const split2 = require('split2')
const collect = require('stream-collect')
const documentHasErrors = require('./documentHasErrors')

function streamToArray(stream) {
  const jsonStream = stream.pipe(getJsonStreamer())
  return collect(jsonStream)
}

function getJsonStreamer() {
  let lineNumber = 0
  return split2(parseRow)

  function parseRow(row) {
    lineNumber++

    if (!row) {
      return undefined
    }

    try {
      const doc = JSON.parse(row)
      const error = documentHasErrors(doc)
      if (error) {
        throw new Error(error)
      }

      return doc
    } catch (err) {
      this.emit(
        'error',
        new Error(`Failed to parse line #${lineNumber}: ${err.message}`)
      )
    }

    return undefined
  }
}

module.exports = streamToArray
