/**
 * Native URLPattern implementations compile a pattern's custom regexp groups with the RegExp `v`
 * (`unicodeSets`) flag, while `urlpattern-polyfill` still uses `u`. The `v` flag reserves
 * `( ) [ ] { } / - |` inside character classes, so regexps path-to-regexp v6 happily accepted —
 * `[a-z0-9-]+`, `[^/]+`, `[\w-]` — make `new URLPattern()` throw on a native implementation while
 * working on the polyfill.
 *
 * Escaping those characters produces a regexp that means the same thing and compiles under both
 * flags, so patterns behave the same on every implementation.
 */

/** `ClassSetSyntaxCharacter`s that must be escaped inside a `v`-mode character class. */
const CLASS_SYNTAX_CHARACTERS = new Set(['(', ')', '[', '{', '}', '/', '|'])

function escapeIfNeeded(char: string): string {
  return CLASS_SYNTAX_CHARACTERS.has(char) || char === '-' ? `\\${char}` : char
}

/**
 * Rewrites the character class starting at `start` (where `source[start]` is `[`).
 */
function rewriteCharacterClass(source: string, start: number): {text: string; end: number} {
  let text = '['
  let index = start + 1

  if (source[index] === '^') {
    text += '^'
    index++
  }

  // Characters emitted since the class opened or since the last range closed. A `-` only denotes a
  // range when there is an atom on both sides of it.
  let atoms = 0

  while (index < source.length) {
    const char = source[index]

    if (char === '\\') {
      text += source.slice(index, index + 2)
      index += 2
      atoms++
      continue
    }

    if (char === ']') {
      return {text: `${text}]`, end: index + 1}
    }

    if (char === '-') {
      const next = source[index + 1]
      const isRange = atoms > 0 && next !== undefined && next !== ']' && next !== '-'
      if (!isRange) {
        text += '\\-'
        index++
        atoms++
        continue
      }
      text += '-'
      index++
      // Consume the upper bound so a `-` right after a range is not read as another range.
      const bound = source[index]
      if (bound === '\\') {
        text += source.slice(index, index + 2)
        index += 2
      } else if (bound !== undefined) {
        text += escapeIfNeeded(bound)
        index++
      }
      atoms = 0
      continue
    }

    text += escapeIfNeeded(char)
    index++
    atoms++
  }

  // Unterminated class: hand it back untouched and let the engine report it.
  return {text: source.slice(start), end: source.length}
}

/**
 * Escapes the characters the RegExp `v` flag reserves inside character classes, leaving the rest of
 * the regexp source alone. The result is accepted under both `u` and `v`, and matches the same input
 * as the original did under `u`.
 *
 * Not handled: `v`-mode reserved double punctuators (`&&`, `!!`, `##`, …) inside a class. They
 * cannot be escaped in a way both flags accept, and no route pattern has been seen using them.
 *
 * @internal
 */
export function makeVFlagSafe(source: string): string {
  let text = ''
  let index = 0

  while (index < source.length) {
    const char = source[index]

    if (char === '\\') {
      text += source.slice(index, index + 2)
      index += 2
      continue
    }

    if (char === '[') {
      const {text: characterClass, end} = rewriteCharacterClass(source, index)
      text += characterClass
      index = end
      continue
    }

    text += char
    index++
  }

  return text
}
