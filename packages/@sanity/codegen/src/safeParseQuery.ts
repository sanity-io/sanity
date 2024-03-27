import {parse} from 'groq-js'

/**
 * safeParseQuery parses a GROQ query string, but first attempts to extract any parameters used in slices. This method is _only_
 * intended for use in type generation where we don't actually execute the parsed AST on a dataset, and should not be used elsewhere.
 * @internal
 */
export function safeParseQuery(query: string) {
  const params: Record<string, unknown> = {}

  for (const param of extractSliceParams(query)) {
    params[param] = 0 // we don't care about the value, just the type
  }
  return parse(query, {params})
}

/**
 * Finds occurences of `[($start|{number})..($end|{number})]` in a query string and returns the start and end values, and return
 * the names of the start and end variables.
 * @internal
 */
export function* extractSliceParams(query: string): Generator<string> {
  const sliceRegex = /\[(\$(\w+)|\d)\.\.\.?(\$(\w+)|\d)\]/g
  const matches = query.matchAll(sliceRegex)
  if (!matches) {
    return
  }
  const params = new Set<string>()
  for (const match of matches) {
    const start = match[1] === `$${match[2]}` ? match[2] : null
    if (start !== null) {
      yield start
    }
    const end = match[3] === `$${match[4]}` ? match[4] : null
    if (end !== null) {
      yield end
    }
  }
}
