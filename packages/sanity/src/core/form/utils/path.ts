import {arrayToJSONMatchPath} from '@sanity/mutator'
import {type Path, type PathSegment} from '@sanity/types'

const IS_NUMERIC = /^\d+$/

function unquote(str: string) {
  return str.replace(/^['"]/, '').replace(/['"]$/, '')
}

function splitAttr(segment: string) {
  const [attr, key] = segment.split('==')
  return {[attr.trim()]: unquote(key.trim())}
}

function parseConstraintSegment(segment: string): PathSegment {
  const match = segment.match(/^(.+?)\s*==\s*(.+)$/)
  if (!match) {
    return coerce(segment)
  }

  const [, lhs, rhs] = match
  const parts = lhs.trim().split('.')
  const value = unquote(rhs.trim())

  let result: Record<string, unknown> = {[parts[parts.length - 1]]: value}
  for (let i = parts.length - 2; i >= 0; i--) {
    result = {[parts[i]]: result}
  }

  return result as PathSegment
}

function coerce(segment: string): PathSegment {
  return IS_NUMERIC.test(segment) ? Number(segment) : segment
}

/**
 * Tokenizes a JSONMatch path string into segments.
 * Handles periods inside quoted strings correctly (e.g., [_key=="object.key"]).
 */
function tokenizeGradientPath(pathStr: string): string[] {
  const tokens: string[] = []
  let current = ''
  let inBracket = false
  let inQuote: string | null = null

  for (let i = 0; i < pathStr.length; i++) {
    const char = pathStr[i]

    // Handle quote state
    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = char
      current += char
      continue
    }
    if (char === inQuote) {
      inQuote = null
      current += char
      continue
    }

    // If inside quotes, just accumulate
    if (inQuote) {
      current += char
      continue
    }

    // Handle brackets
    if (char === '[') {
      if (current) {
        tokens.push(current)
        current = ''
      }
      inBracket = true
      continue
    }
    if (char === ']') {
      if (current) {
        tokens.push(current)
        current = ''
      }
      inBracket = false
      continue
    }

    // Handle dots (only split on dots outside brackets)
    if (char === '.' && !inBracket) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (current) {
    tokens.push(current)
  }

  return tokens
}

function parseGradientPath(focusPathStr: string): Path {
  return tokenizeGradientPath(focusPathStr)
    .filter(Boolean)
    .map((seg) => {
      if (!seg.includes('==')) {
        return coerce(seg)
      }
      return seg.includes('.') ? parseConstraintSegment(seg) : splitAttr(seg)
    }) as Path
}

/**
 * @internal
 */
export function encodePath(formBuilderPath: Path): string {
  return arrayToJSONMatchPath(formBuilderPath)
}

/**
 * @internal
 */
export function decodePath(gradientPath: string): Path {
  return parseGradientPath(gradientPath)
}
