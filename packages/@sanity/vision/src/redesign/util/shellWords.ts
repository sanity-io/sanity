/** The escapes bash's ANSI-C quoting (`$'…'`) knows besides `\xHH`, `\uHHHH`, `\UHHHHHHHH` and octal */
const ANSI_C_ESCAPES: Record<string, string> = {
  '\\': '\\',
  "'": "'",
  '"': '"',
  '?': '?',
  'a': '\x07',
  'b': '\b',
  'e': '\x1b',
  'E': '\x1b',
  'f': '\f',
  'n': '\n',
  'r': '\r',
  't': '\t',
  'v': '\v',
}

const ANSI_C_ESCAPE =
  /^\\(?:x([0-9a-fA-F]{1,2})|u([0-9a-fA-F]{1,4})|U([0-9a-fA-F]{1,8})|([0-7]{1,3})|(.))/s

function isUnquotedWhitespace(char: string): boolean {
  return char === ' ' || char === '\t' || char === '\n' || char === '\r'
}

/** `\UHHHHHHHH` can name a code point no string can hold; that becomes the replacement character */
function fromCodePoint(code: number): string {
  return code <= 0x10ffff ? String.fromCodePoint(code) : '\uFFFD'
}

/**
 * Splits a command line into its words the way a POSIX shell (bash, zsh) does before running it:
 * on unquoted whitespace, honouring single quotes, double quotes (with their `\"`, `\\`, `\$` and
 * backslash-backtick escapes), backslash escapes, bash's ANSI-C `$'…'` quoting and
 * backslash-newline continuations. Nothing is expanded: `$VAR` stays as written. Returns `null`
 * for an unclosed quote, since the line is then not a command.
 */
export function splitShellWords(text: string): string[] | null {
  const words: string[] = []
  let word = ''
  // Tells an empty quoted word (`''`) from no word at all
  let inWord = false
  let i = 0

  const endWord = () => {
    if (inWord) words.push(word)
    word = ''
    inWord = false
  }

  while (i < text.length) {
    const char = text[i]

    if (isUnquotedWhitespace(char)) {
      endWord()
      i++
      continue
    }

    if (char === '\\') {
      const next = text[i + 1]
      // A continuation is neither a word nor a break between words
      if (next === '\n') {
        i += 2
        continue
      }
      if (next === '\r' && text[i + 2] === '\n') {
        i += 3
        continue
      }
      inWord = true
      if (next === undefined) {
        word += char
        i++
      } else {
        word += next
        i += 2
      }
      continue
    }
    inWord = true

    if (char === "'") {
      const end = text.indexOf("'", i + 1)
      if (end === -1) return null
      word += text.slice(i + 1, end)
      i = end + 1
      continue
    }

    if (char === '"') {
      i++
      let closed = false
      while (i < text.length) {
        const quoted = text[i]
        if (quoted === '"') {
          closed = true
          i++
          break
        }
        if (quoted === '\\') {
          const next = text[i + 1]
          if (next === '"' || next === '\\' || next === '$' || next === '`') {
            word += next
            i += 2
          } else if (next === '\n') {
            i += 2
          } else {
            // Any other backslash stays, as in bash
            word += quoted
            i++
          }
          continue
        }
        word += quoted
        i++
      }
      if (!closed) return null
      continue
    }

    if (char === '$' && text[i + 1] === "'") {
      i += 2
      let closed = false
      while (i < text.length) {
        const quoted = text[i]
        if (quoted === "'") {
          closed = true
          i++
          break
        }
        if (quoted === '\\') {
          const match = ANSI_C_ESCAPE.exec(text.slice(i))
          if (!match) {
            // A trailing backslash
            word += quoted
            i++
            continue
          }
          const [whole, hex, unicode, longUnicode, octal, other] = match
          const code = hex ?? unicode ?? longUnicode
          if (code !== undefined) {
            word += fromCodePoint(parseInt(code, 16))
          } else if (octal !== undefined) {
            word += fromCodePoint(parseInt(octal, 8))
          } else {
            word += ANSI_C_ESCAPES[other] ?? `\\${other}`
          }
          i += whole.length
          continue
        }
        word += quoted
        i++
      }
      if (!closed) return null
      continue
    }

    word += char
    i++
  }
  endWord()
  return words
}
