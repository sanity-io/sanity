const tryParseParams = val => {
  try {
    return val ? JSON.parse(val) : {}
  } catch (err) {
    err.message = `Parameters are not valid JSON:\n\n${err.message}`
    return err
  }
}

export default tryParseParams
