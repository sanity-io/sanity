import {deriveQuerySubject} from '../tabTitle'

/**
 * Identifiers `sanity typegen` declares itself and never hands out to a schema type or a query
 * result, as `@sanity/codegen`'s `RESERVED_IDENTIFIERS`
 */
export const RESERVED_IDENTIFIERS: ReadonlySet<string> = new Set([
  'SanityQueries',
  'AllSanitySchemaTypes',
  'internalGroqTypeReferenceTo',
  'ArrayOf',
])

export const IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

/** Whether `input` can be written bare as a TypeScript identifier or object key */
export function isIdentifierName(input: string): boolean {
  return IDENTIFIER.test(input)
}

/**
 * The identifier `@sanity/codegen` derives from a name: a leading digit becomes `_`, and every
 * run of characters that cannot be in an identifier is dropped while the character after it is
 * upper-cased (`foo-bar` and `foo.bar` both become `fooBar`).
 */
export function sanitizeIdentifier(input: string): string {
  return input
    .replace(/^\d/, '_')
    .replaceAll(/[^$\w]+(.)/g, (_, char: string) => char.toUpperCase())
}

function normalizeIdentifier(input: string): string {
  const sanitized = sanitizeIdentifier(input)
  return `${sanitized.charAt(0).toUpperCase()}${sanitized.slice(1)}`
}

/**
 * The type alias `sanity typegen` declares for `name`: the normalized identifier, with a `_2`,
 * `_3`, … suffix when an earlier type already took it or it is one typegen reserves
 */
export function getUniqueIdentifierForName(
  name: string,
  currentIdentifiers: ReadonlySet<string>,
): string {
  const desiredName = normalizeIdentifier(name)
  let resultingName = desiredName
  for (
    let index = 2;
    currentIdentifiers.has(resultingName) || RESERVED_IDENTIFIERS.has(resultingName);
    index++
  ) {
    resultingName = `${desiredName}_${index}`
  }
  return resultingName
}

/**
 * The name of a query's result type before normalization, following the casing of the query's
 * variable the way `sanity typegen` does: `authorQuery` gives `authorQueryResult`,
 * `AUTHOR_QUERY` gives `AUTHOR_QUERY_RESULT` and `author_query` gives `author_query_result`
 */
export function resultSuffix(variableName: string): string {
  if (!variableName) return 'result'
  const isUpperSnake = /^[A-Z0-9_]+$/.test(variableName)
  const isSnake = /^[a-z0-9_]+$/.test(variableName) && variableName.includes('_')
  const isCamel = /^[a-z][A-Za-z0-9]*$/.test(variableName)
  if (isCamel) return `${variableName}Result`
  if (isUpperSnake) return `${variableName}_RESULT`
  if (isSnake) return `${variableName}_result`
  return `${variableName.replaceAll(/[^A-Za-z0-9]/g, '')}Result`
}

/**
 * The variable a query would be assigned to in code, which typegen names the result type after:
 * the tab's own title when the user gave it one (`Published posts` becomes `publishedPosts`),
 * otherwise what the query is about with a `Query` suffix (`*[_type == "author"]` becomes
 * `authorQuery`, `*[_type in ["post", "page"]]` becomes `postPageQuery`). Word boundaries in
 * schema type names survive, since the words are joined, not upper-cased.
 */
export function toQueryVariableName(query: string, title?: string): string {
  const ownTitle = title?.trim()
  const words = (ownTitle || deriveQuerySubject(query) || '').split(/[^a-zA-Z0-9]+/).filter(Boolean)
  if (words.length === 0 || /^\d/.test(words[0])) {
    words.unshift('query')
  } else if (!ownTitle) {
    words.push('query')
  }
  return words
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('')
}

/**
 * The name of a query's result type, as `sanity typegen` would name it for a query assigned to
 * `variableName`: `authorQuery` becomes `AuthorQueryResult`, and never collides with the
 * identifiers already in use (the schema's own types)
 */
export function toResultTypeName(
  variableName: string,
  currentIdentifiers: ReadonlySet<string> = new Set(),
): string {
  return getUniqueIdentifierForName(resultSuffix(variableName), currentIdentifiers)
}
