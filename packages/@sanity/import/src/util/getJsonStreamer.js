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
      this.emit('error', new Error(`Failed to parse line #${lineNumber}: ${err.message}`))
    }

    return undefined
  }
}
