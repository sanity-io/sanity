/**
 * URLPattern's pathname syntax is derived from path-to-regexp v6, but the two are not identical and
 * URLPattern exposes no metadata about the groups it parsed. This module walks a route pattern once
 * to recover that metadata, and rewrites the parts where the two syntaxes disagree.
 */
import {makeVFlagSafe} from './vFlagSafeRegexp'

const IDENTIFIER_START = /[A-Za-z$_]/
const IDENTIFIER_PART = /[A-Za-z0-9$_]/
const MODIFIERS = new Set(['?', '*', '+'])
const REPEAT_MODIFIERS = new Set(['*', '+'])
/**
 * Characters path-to-regexp treats as prefixes, and therefore as the delimiter that repeated
 * matches of a group are joined by.
 */
const PREFIXES = new Set(['/', '.'])
const DEFAULT_SEPARATOR = '/'

/**
 * A capturing group found in a route pattern, in source order.
 * @internal
 */
export interface RoutePatternGroup {
  /** Named groups keep their name; unnamed groups are keyed by index, the way URLPattern keys them. */
  name: string
  /** Whether the group can match repeatedly, so its matches should be split back into an array. */
  repeat: boolean
  /** The delimiter repeated matches are joined by. */
  separator: string
  /** Whether the group was written with path-to-regexp v8 wildcard syntax (`*name`). */
  legacyWildcard: boolean
}

/** @internal */
export interface ParsedRoutePattern {
  /** The route pattern rewritten into URLPattern pathname syntax. */
  pathname: string
  groups: RoutePatternGroup[]
}

/** @internal */
export interface ParseRoutePatternOptions {
  /**
   * Rewrite path-to-regexp v8 wildcards (`*name`) into the URLPattern equivalent (`:name(.*)`).
   * URLPattern reads `*name` as a wildcard followed by the literal text `name`, so leaving it alone
   * silently matches the wrong paths instead of failing.
   *
   * @defaultValue true
   */
  rewriteLegacyWildcards?: boolean
}

/** @internal */
export function parseRoutePattern(
  pattern: string,
  options: ParseRoutePatternOptions = {},
): ParsedRoutePattern {
  const {rewriteLegacyWildcards = true} = options
  const groups: RoutePatternGroup[] = []

  let pathname = ''
  let unnamedGroupIndex = 0
  let index = 0
  /** Literal text emitted since the last group, used to work out a group's prefix. */
  let literal = ''
  /** The `{…}` group currently being walked, if any. */
  let brace: {firstGroup: number; literal: string} | undefined

  function readIdentifier(from: number): string {
    if (!IDENTIFIER_START.test(pattern[from] ?? '')) return ''
    let end = from + 1
    while (end < pattern.length && IDENTIFIER_PART.test(pattern[end])) end++
    return pattern.slice(from, end)
  }

  /** Reads a balanced `(…)` regexp group, or returns undefined so URLPattern can report the error. */
  function readRegexpGroup(from: number): string | undefined {
    let depth = 0
    for (let end = from; end < pattern.length; end++) {
      const char = pattern[end]
      if (char === '\\') {
        end++
        continue
      }
      if (char === '(') depth++
      else if (char === ')') {
        depth--
        if (depth === 0) return pattern.slice(from, end + 1)
      }
    }
    return undefined
  }

  function takeModifier(): string {
    const char = pattern[index]
    if (char !== undefined && MODIFIERS.has(char)) {
      index++
      return char
    }
    return ''
  }

  function pushGroup(name: string, modifier: string, legacyWildcard = false): void {
    // A repeated group joins its matches with the prefix in front of it: the literal text inside its
    // own `{…}` when it has one, otherwise the delimiter it follows.
    const bracePrefix =
      brace !== undefined && brace.firstGroup === groups.length ? brace.literal.at(-1) : undefined
    const prefix = literal.at(-1)
    groups.push({
      name,
      repeat: legacyWildcard || REPEAT_MODIFIERS.has(modifier),
      separator:
        bracePrefix ?? (prefix !== undefined && PREFIXES.has(prefix) ? prefix : DEFAULT_SEPARATOR),
      legacyWildcard,
    })
    literal = ''
  }

  function appendLiteral(text: string): void {
    pathname += text
    literal += text
    if (brace !== undefined && brace.firstGroup === groups.length) brace.literal += text
  }

  while (index < pattern.length) {
    const char = pattern[index]

    // An escaped character is always literal text.
    if (char === '\\') {
      pathname += char
      appendLiteral(pattern[index + 1] ?? '')
      index += 2
      continue
    }

    if (char === '{') {
      brace = {firstGroup: groups.length, literal: ''}
      pathname += char
      index++
      continue
    }

    if (char === '}') {
      pathname += char
      index++
      const modifier = takeModifier()
      pathname += modifier
      if (brace !== undefined && REPEAT_MODIFIERS.has(modifier)) {
        for (let group = brace.firstGroup; group < groups.length; group++) {
          groups[group].repeat = true
        }
      }
      brace = undefined
      literal = ''
      continue
    }

    // `:name`, optionally followed by a `(…)` regexp and a modifier.
    if (char === ':') {
      const name = readIdentifier(index + 1)
      if (!name) {
        appendLiteral(char)
        index++
        continue
      }
      index += 1 + name.length
      let regexp = ''
      if (pattern[index] === '(') {
        const group = readRegexpGroup(index)
        if (group !== undefined) {
          regexp = makeVFlagSafe(group)
          index += group.length
        }
      }
      const modifier = takeModifier()
      pathname += `:${name}${regexp}${modifier}`
      pushGroup(name, modifier)
      continue
    }

    // An unnamed `(…)` regexp group.
    if (char === '(') {
      const group = readRegexpGroup(index)
      if (group === undefined) {
        appendLiteral(char)
        index++
        continue
      }
      index += group.length
      const modifier = takeModifier()
      pathname += makeVFlagSafe(group) + modifier
      pushGroup(String(unnamedGroupIndex++), modifier)
      continue
    }

    // A modifier is always consumed alongside the group it applies to, so an asterisk reaching this
    // point is a wildcard. `*name` is path-to-regexp v8 syntax; a bare `*` is URLPattern's own.
    if (char === '*') {
      index++
      const name = rewriteLegacyWildcards ? readIdentifier(index) : ''
      if (name) {
        index += name.length
        const modifier = takeModifier()
        pathname += `:${name}(.*)${modifier}`
        pushGroup(name, modifier, true)
        continue
      }
      const modifier = takeModifier()
      pathname += `*${modifier}`
      pushGroup(String(unnamedGroupIndex++), modifier)
      continue
    }

    appendLiteral(char)
    index++
  }

  return {pathname, groups}
}
