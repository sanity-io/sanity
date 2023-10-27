import type {
  IdentifierToken,
  NumberToken,
  QuotedToken,
  SymbolClass,
  SymbolToken,
  Token,
} from './types'

// TODO: Support '*'

const digitChar = /[0-9]/
const attributeCharMatcher = /^[a-zA-Z0-9_]$/
const attributeFirstCharMatcher = /^[a-zA-Z_]$/

const symbols: Record<SymbolClass, string[]> = {
  // NOTE: These are compared against in order of definition,
  // thus '==' must come before '=', '>=' before '>', etc.
  operator: ['..', '.', ',', ':', '?'],
  comparator: ['>=', '<=', '<', '>', '==', '!='],
  keyword: ['$', '@'],
  boolean: ['true', 'false'],
  paren: ['[', ']'],
}

const symbolClasses = Object.keys(symbols) as SymbolClass[]

type TokenizerFn = () => Token | null

/**
 * Tokenizes a jsonpath2 expression
 */
class Tokenizer {
  source: string
  i: number
  length: number
  tokenizers: TokenizerFn[]

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

  tokenize(): Token[] {
    const result: Token[] = []
    while (!this.EOF()) {
      this.chompWhitespace()
      let token: Token | null = null
      // @todo refactor into a simpler `.find()`?
      const found = this.tokenizers.some((tokenizer) => {
        token = tokenizer()
        return Boolean(token)
      })
      if (!found || !token) {
        throw new Error(`Invalid tokens in jsonpath '${this.source}' @ ${this.i}`)
      }
      result.push(token)
    }
    return result
  }

  takeWhile(fn: (character: string) => string | null): string | null {
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

  peek(): string | null {
    if (this.EOF()) {
      return null
    }
    return this.source[this.i]
  }

  consume(str: string) {
    if (this.i + str.length > this.length) {
      throw new Error(`Expected ${str} at end of jsonpath`)
    }
    if (str === this.source.slice(this.i, this.i + str.length)) {
      this.i += str.length
    } else {
      throw new Error(`Expected "${str}", but source contained "${this.source.slice()}`)
    }
  }

  // Tries to match the upcoming bit of string with the provided string. If it matches, returns
  // the string, then advances the read pointer to the next bit. If not, returns null and nothing
  // happens.
  tryConsume(str: string) {
    if (this.i + str.length > this.length) {
      return null
    }
    if (str === this.source.slice(this.i, this.i + str.length)) {
      this.i += str.length
      return str
    }
    return null
  }

  chompWhitespace(): void {
    this.takeWhile((char): string | null => {
      return char === ' ' ? '' : null
    })
  }

  tokenizeQuoted(): QuotedToken | null {
    const quote = this.peek()
    if (quote === "'" || quote === '"') {
      this.consume(quote)
      let escape = false
      const inner = this.takeWhile((char) => {
        if (escape) {
          escape = false
          return char
        }
        if (char === '\\') {
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
        quote: quote === '"' ? 'double' : 'single',
      }
    }
    return null
  }

  tokenizeIdentifier(): IdentifierToken | null {
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

  tokenizeNumber(): NumberToken | null {
    const start = this.i
    let dotSeen = false
    let digitSeen = false
    let negative = false
    if (this.peek() === '-') {
      negative = true
      this.consume('-')
    }
    const number = this.takeWhile((char) => {
      if (char === '.' && !dotSeen && digitSeen) {
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

  tokenizeSymbol(): SymbolToken | null {
    for (const symbolClass of symbolClasses) {
      const patterns = symbols[symbolClass]
      const symbol = patterns.find((pattern) => this.tryConsume(pattern))
      if (symbol) {
        return {
          type: symbolClass,
          symbol,
        }
      }
    }

    return null
  }
}

export function tokenize(jsonpath: string): Token[] {
  return new Tokenizer(jsonpath).tokenize()
}
