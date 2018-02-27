// Converts a string into an abstract syntax tree representation

import tokenize from './tokenize'

class Parser {
  tokens: Array
  length: number
  i: number
  constructor(path: string) {
    this.tokens = tokenize(path)
    this.length = this.tokens.length
    this.i = 0
  }

  parse() {
    return this.parsePath()
  }

  EOF() {
    return this.i >= this.length
  }

  // Look at upcoming token
  peek() {
    if (this.EOF()) {
      return null
    }
    return this.tokens[this.i]
  }

  consume() {
    const result = this.peek()
    // console.log("consumed", result)
    this.i += 1
    return result
  }

  // Return next token if it matches the pattern
  probe(pattern) {
    const token = this.peek()
    // console.log("Probing", token, "for", pattern)
    if (!token) {
      // console.log(" -> nay", token)
      return null
    }
    const mismatch = Object.keys(pattern).find(key => {
      const value = pattern[key]
      if (!token[key] || token[key] != value) {
        // console.log(" -> nay", key)
        return true
      }
      return false
    })
    if (mismatch) {
      return null
    }
    // console.log(" -> yay", token)
    return token
  }

  // Return and consume next token if it matches the pattern
  match(pattern) {
    if (this.probe(pattern)) {
      return this.consume()
    }
    return null
  }

  parseAttribute(): Object {
    const token = this.match({type: 'identifier'})
    if (token) {
      return {
        type: 'attribute',
        name: token.name
      }
    }
    const quoted = this.match({type: 'quoted', quote: 'single'})
    if (quoted) {
      return {
        type: 'attribute',
        name: quoted.value
      }
    }
    return null
  }

  parseAlias(): Object {
    if (this.match({type: 'keyword', symbol: '@'}) || this.match({type: 'keyword', symbol: '$'})) {
      return {
        type: 'alias',
        target: 'self'
      }
    }
    return null
  }

  parseNumber(): Object {
    const token = this.match({type: 'number'})
    if (token) {
      return {
        type: 'number',
        value: token.value
      }
    }
    return null
  }

  parseNumberValue(): Object {
    const expr = this.parseNumber()
    if (expr) {
      return expr.value
    }
    return null
  }

  parseSliceSelector(): Object {
    const start = this.i
    const result = {
      type: 'range'
    }
    result.start = this.parseNumberValue()
    const colon1 = this.match({type: 'operator', symbol: ':'})
    if (colon1) {
      result.end = this.parseNumberValue()
      const colon2 = this.match({type: 'operator', symbol: ':'})
      if (colon2) {
        result.step = this.parseNumberValue()
      }
    } else {
      if (result.start !== null) {
        // Unwrap, this was just a single index not followed by colon
        return {type: 'index', value: result.start}
      }
      // Rewind, this was actually nothing
      this.i = start
      return null
    }
    if (result.start === null && result.end === null) {
      // rewind, this wasnt' a slice selector
      this.i = start
      // console.log("Mising start and end of slice, rewinding")
      return null
    }
    return result
  }

  parseValueReference(): Object {
    return this.parseAttribute() || this.parseSliceSelector()
  }

  parseLiteralValue(): Object {
    const literalString = this.match({type: 'quoted', quote: 'double'})
    if (literalString) {
      return {
        type: 'string',
        value: literalString.value
      }
    }
    const literalBoolean = this.match({type: 'boolean'})
    if (literalBoolean) {
      return {
        type: 'boolean',
        value: literalBoolean.symbol == 'true'
      }
    }
    return this.parseNumber()
  }

  parseFilterExpression(): Object {
    const start = this.i
    const expr = this.parseAttribute() || this.parseAlias()
    if (!expr) {
      return null
    }
    if (this.match({type: 'operator', symbol: '?'})) {
      return {
        type: 'constraint',
        operator: '?',
        lhs: expr
      }
    }
    const binOp = this.match({type: 'comparator'})
    if (!binOp) {
      // No expression, rewind!
      this.i = start
      return null
    }
    const lhs = expr
    const rhs = this.parseLiteralValue()
    if (!rhs) {
      throw new Error(`Operator ${binOp.symbol} needs a literal value at the right hand side`)
    }
    return {
      type: 'constraint',
      operator: binOp.symbol,
      lhs: lhs,
      rhs: rhs
    }
  }

  parseExpression(): Object {
    return this.parseFilterExpression() || this.parseValueReference()
  }

  /* eslint-disable complexity, max-depth */
  parseUnion(): Object {
    if (!this.match({type: 'paren', symbol: '['})) {
      return null
    }
    const terms = []
    let expr = this.parseFilterExpression() || this.parsePath() || this.parseValueReference()
    while (expr) {
      terms.push(expr)
      // End of union?
      if (this.match({type: 'paren', symbol: ']'})) {
        break
      }
      if (!this.match({type: 'operator', symbol: ','})) {
        throw new Error('Expected ]')
      }
      expr = this.parseFilterExpression() || this.parsePath() || this.parseValueReference()
      if (!expr) {
        throw new Error("Expected expression following ','")
      }
    }
    return {
      type: 'union',
      nodes: terms
    }
  }
  /* eslint-enable complexity, max-depth */

  parseRecursive(): Object {
    if (this.match({type: 'operator', symbol: '..'})) {
      const subpath = this.parsePath()
      if (!subpath) {
        throw new Error("Expected path following '..' operator")
      }
      return {
        type: 'recursive',
        term: subpath
      }
    }
    return null
  }

  /* eslint-disable complexity, max-depth */
  parsePath(): Object {
    const nodes = []
    const expr = this.parseAttribute() || this.parseUnion() || this.parseRecursive()
    if (!expr) {
      return null
    }
    nodes.push(expr)
    while (!this.EOF()) {
      if (this.match({type: 'operator', symbol: '.'})) {
        const attr = this.parseAttribute()
        if (!attr) {
          throw new Error("Expected attribute name following '.")
        }
        nodes.push(attr)
        continue
      } else if (this.probe({type: 'paren', symbol: '['})) {
        const union = this.parseUnion()
        if (!union) {
          throw new Error("Expected union following '['")
        }
        nodes.push(union)
      } else {
        const recursive = this.parseRecursive()
        if (recursive) {
          nodes.push(recursive)
        }
        break
      }
    }
    if (nodes.length == 1) {
      return nodes[0]
    }
    return {
      type: 'path',
      nodes: nodes
    }
  }
}
/* eslint-enable complexity, max-depth */

export default function parse(path: string) {
  return new Parser(path).parse()
}
