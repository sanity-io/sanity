const WILDCARD_TOKEN = '*'
const NEGATION_TOKEN = '-'
const TOKEN_REGEX = /(?:[^\s"]+|"[^"]*")+/g

/**
 * @internal
 */
export function isNegationToken(token: string | undefined): boolean {
  return typeof token !== 'undefined' && token.trim().at(0) === NEGATION_TOKEN
}

/**
 * @internal
 */
export function isPrefixToken(token: string | undefined): boolean {
  return typeof token !== 'undefined' && token.trim().at(-1) === WILDCARD_TOKEN
}

/**
 * @internal
 */
export function isExactMatchToken(token: string | undefined): boolean {
  return [token?.at(0), token?.at(-1)].every((character) => character === '"')
}

/**
 * @internal
 */
export function prefixLast(query: string): string {
  const tokens = (query.match(TOKEN_REGEX) ?? []).map((token) => token.trim())

  const finalIncrementalTokenIndex = tokens.findLastIndex(
    (token) => !isNegationToken(token) && !isExactMatchToken(token),
  )

  const finalIncrementalToken = tokens[finalIncrementalTokenIndex]

  if (tokens.length === 0) {
    return WILDCARD_TOKEN
  }

  if (isPrefixToken(finalIncrementalToken) || typeof finalIncrementalToken === 'undefined') {
    return tokens.join(' ')
  }

  const prefixedTokens = [...tokens]
  prefixedTokens.splice(finalIncrementalTokenIndex, 1, `${finalIncrementalToken}${WILDCARD_TOKEN}`)
  return prefixedTokens.join(' ')
}
