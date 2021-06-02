export function tryParseParams(val: string): Record<string, unknown> {
  try {
    return JSON.parse(val)
  } catch (err) {
    err.message = `Parameters are not valid JSON:\n\n${err.message}`
    return err
  }
}
