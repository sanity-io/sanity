module.exports = line => {
  try {
    return JSON.parse(line)
  } catch (err) {
    // Catch half-done lines with an error at the end
    const errorPosition = line.lastIndexOf('{"error":')
    if (errorPosition === -1) {
      err.message = `${err.message} (${line})`
      throw err
    }

    const errorJson = line.slice(errorPosition)
    const errorLine = JSON.parse(errorJson)
    const error = errorLine && errorLine.error
    if (error && error.description) {
      throw new Error(`Error streaming dataset: ${error.description}\n\n${errorJson}\n`)
    }

    throw err
  }
}
