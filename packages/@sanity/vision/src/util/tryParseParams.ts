import JSON5 from 'json5'

export function tryParseParams(val: string): Record<string, unknown> | Error {
  try {
    const parsed = val ? JSON5.parse(val) : {}
    return typeof parsed === 'object' && parsed && !Array.isArray(parsed) ? parsed : {}
  } catch (err) {
    // JSON5 always prefixes the error message with JSON5:, so we remove it
    // to clean up the error tooltip
    err.message = `Parameters are not valid JSON:\n\n${err.message.replace('JSON5:', '')}`
    return err
  }
}
