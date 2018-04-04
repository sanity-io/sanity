const split = require('split2')
const documentHasErrors = require('../documentHasErrors')

module.exports = function getJsonStreamer() {
  let lineNumber = 0
  return split(parseRow)

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
      const errorMessage = getErrorMessage(err)
      this.emit('error', new Error(errorMessage))
    }

    return undefined
  }

  function getErrorMessage(err) {
    const suffix =
      lineNumber === 1 ? '\n\nMake sure this is valid ndjson (one JSON-document *per line*)' : ''

    return `Failed to parse line #${lineNumber}: ${err.message}${suffix}`
  }
}
