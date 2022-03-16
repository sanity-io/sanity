const JSON5 = require('json5')

export const tryParseParams = (val) => {
  try {
    return val ? JSON5.parse(val) : {}
  } catch (err) {
    // JSON5 always prefixes the error message with JSON5:, so we remove it
    // to clean up the error tooltip
    err.message = `Parameters are not valid JSON:\n\n${err.message.replace('JSON5:', '')}`
    return err
  }
}
