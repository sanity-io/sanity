interface Options {
  errorLabel: string
}

type Parser<Type> = (line: string) => Type

/**
 * Create a safe JSON parser that is able to handle lines interrupted by an error object.
 *
 * TODO: Unify with the `tryParseJson` function that already exists at
 * `packages/@sanity/export/src/tryParseJson.js`.
 */
export function createSafeJsonParser<Type>({errorLabel}: Options): Parser<Type> {
  return function safeJsonParser(line) {
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
        throw new Error(`${errorLabel}: ${error.description}\n\n${errorJson}\n`)
      }

      throw err
    }
  }
}
