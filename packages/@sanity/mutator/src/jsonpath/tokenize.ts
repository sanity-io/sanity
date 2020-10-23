// Tokenizes a jsonpath2 expression

// TODO: Support '*'

const digitChar = /[0-9]/
const attributeCharMatcher = /^[a-zA-Z0-9_]$/
const attributeFirstCharMatcher = /^[a-zA-Z_]$/
const symbols = {
  operator: ['..', '.', ',', ':', '?'],
  comparator: ['>', '>=', '<', '<=', '==', '!='],
  keyword: ['$', '@'],
  boolean: ['true', 'false'],
  paren: ['[', ']'],
}

class Tokenizer {
  source: string
  i: number
  start: number
  length: number
  tokenizers: any[]
  constructor(path: string) {
    this.source = path
    this.length = path.length
    this.i = 0
    this.tokenizers = [
      this.tokenizeSymbol,
      this.tokenizeIdentifier,
      this.tokenizeNumber,
      this.tokenizeQuoted,
    ].map((fn) => fn.bind(this))
  }

  tokenize(): string[] {
    const result = []
    while (!this.EOF()) {
      let token
      this.chompWhitespace()
      const found = this.tokenizers.find((tokenizer) => {
        token = tokenizer()
        return !!token
      })
      if (!found) {
        throw new Error(`Invalid tokens in jsonpath '${this.source}' @ ${this.i}`)
      }
      result.push(token)
    }
    return result
  }

  takeWhile(fn: (character: string) => string): string {
    const start = this.i
    let result = ''
    while (!this.EOF()) {
      const nextChar = fn(this.source[this.i])
      if (nextChar === null) {
        break
      }
      result += nextChar
      this.i++
    }
    if (this.i === start) {
      return null
    }
    return result
  }

  EOF(): boolean {
    return this.i >= this.length
  }

  peek(): string {
    if (this.EOF()) {
      return null
    }
    return this.source[this.i]
  }

  consume(str: string) {
    if (this.i + str.length > this.length) {
      throw new Error(`Expected ${str} at end of jsonpath`)
    }
    if (str == this.source.slice(this.i, this.i + str.length)) {
      this.i += str.length
    } else {
      throw new Error(`Expected "${str}", but source contained "${this.source.slice(this.start)}`)
    }
  }

  // Tries to match the upcoming bit of string with the provided string. If it matches, returns
  // the string, then advances the read pointer to the next bit. If not, returns null and nothing
  // happens.
  tryConsume(str: string) {
    if (this.i + str.length > this.length) {
      return null
    }
    if (str == this.source.slice(this.i, this.i + str.length)) {
      this.i += str.length
      return str
    }
    return null
  }

  chompWhitespace() {
    this.takeWhile((char) => {
      return char == ' ' ? '' : null
    })
  }

  tokenizeQuoted(): Object {
    const quote = this.peek()
    if (quote == "'" || quote == '"') {
      this.consume(quote)
      let escape = false
      const inner = this.takeWhile((char) => {
        if (escape) {
          escape = false
          return char
        }
        if (char == '\\') {
          escape = true
          return ''
        }
        if (char != quote) {
          return char
        }
        return null
      })
      this.consume(quote)
      return {
        type: 'quoted',
        value: inner,
        quote: quote == '"' ? 'double' : 'single',
      }
    }
    return null
  }

  tokenizeIdentifier(): Object {
    let first = true
    const identifier = this.takeWhile((char) => {
      if (first) {
        first = false
        return char.match(attributeFirstCharMatcher) ? char : null
      }
      return char.match(attributeCharMatcher) ? char : null
    })
    if (identifier !== null) {
      return {
        type: 'identifier',
        name: identifier,
      }
    }
    return null
  }

  tokenizeNumber(): Object {
    const start = this.i
    let dotSeen = false
    let digitSeen = false
    let negative = false
    if (this.peek() == '-') {
      negative = true
      this.consume('-')
    }
    const number = this.takeWhile((char) => {
      if (char == '.' && !dotSeen && digitSeen) {
        dotSeen = true
        return char
      }
      digitSeen = true
      return char.match(digitChar) ? char : null
    })
    if (number !== null) {
      return {
        type: 'number',
        value: negative ? -number : +number,
        raw: negative ? `-${number}` : number,
      }
    }
    // No number, rewind
    this.i = start
    return null
  }

  tokenizeSymbol(): Object {
    let result: Object = null
    Object.keys(symbols).find((symbolClass) => {
      const patterns = symbols[symbolClass]
      const found = patterns.find((pattern) => this.tryConsume(pattern))
      if (found) {
        result = {
          type: symbolClass,
          symbol: found,
        }
        return true
      }
      return false
    })
    return result
  }
}

export default function tokenize(jsonpath) {
  return new Tokenizer(jsonpath).tokenize()
}
