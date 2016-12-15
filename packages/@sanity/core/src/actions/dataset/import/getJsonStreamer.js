const split2 = require('split2')

export default () => {
  let lineNumber = 0
  return split2(line => {
    lineNumber++
    try {
      return JSON.parse(line)
    } catch (err) {
      throw new Error(`Failed to parse line #${lineNumber} as JSON: ${err.message}`)
    }
  })
}
