// Converts a string into an abstract syntax tree representation

import {tokenize} from './tokenize'
import type {
  AliasExpr,
  AttributeExpr,
  BooleanExpr,
  ConstraintExpr,
  IndexExpr,
  NumberExpr,
  PathExpr,
  RangeExpr,
  RecursiveExpr,
  StringExpr,
  Token,
  UnionExpr,
} from './types'

// TODO: Support '*'

class Parser {
  tokens: Token[]
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
    this.i += 1
    return result
  }

  // Return next token if it matches the pattern
  probe(pattern: Record<string, unknown>): Token | null {
    const token = this.peek()
    if (!token) {
      return null
    }

    const record = token as unknown as Record<string, unknown>
    const match = Object.keys(pattern).every((key) => {
      return key in token && pattern[key] === record[key]
    })

    return match ? token : null
  }

  // Return and consume next token if it matches the pattern
  match(pattern: Partial<Token>): Token | null {
    return this.probe(pattern) ? this.consume() : null
  }

  parseAttribute(): AttributeExpr | null {
    const token = this.match({type: 'identifier'})
    if (token && token.type === 'identifier') {
      return {
        type: 'attribute',
        name: token.name,
      }
    }
    const quoted = this.match({type: 'quoted', quote: 'single'})
    if (quoted && quoted.type === 'quoted') {
      return {
        type: 'attribute',
        name: quoted.value || '',
      }
    }
    return null
  }

  parseAlias(): AliasExpr | null {
    if (this.match({type: 'keyword', symbol: '@'}) || this.match({type: 'keyword', symbol: '$'})) {
      return {
        type: 'alias',
        target: 'self',
      }
    }
    return null
  }

  parseNumber(): NumberExpr | null {
    const token = this.match({type: 'number'})
    if (token && token.type === 'number') {
      return {
        type: 'number',
        value: token.value,
      }
    }
    return null
  }

  parseNumberValue(): number | null {
    const expr = this.parseNumber()
    if (expr) {
      return expr.value
    }
    return null
  }

  parseSliceSelector(): RangeExpr | IndexExpr | null {
    const start = this.i
    const rangeStart = this.parseNumberValue()

    const colon1 = this.match({type: 'operator', symbol: ':'})
    if (!colon1) {
      if (rangeStart === null) {
        // Rewind, this was actually nothing
        this.i = start
        return null
      }

      // Unwrap, this was just a single index not followed by colon
      return {type: 'index', value: rangeStart}
    }

    const result: RangeExpr = {
      type: 'range',
      start: rangeStart,
      end: this.parseNumberValue(),
    }

    const colon2 = this.match({type: 'operator', symbol: ':'})
    if (colon2) {
      result.step = this.parseNumberValue()
    }

    if (result.start === null && result.end === null) {
      // rewind, this wasnt' a slice selector
      this.i = start
      return null
    }

    return result
  }

  parseValueReference(): AttributeExpr | RangeExpr | IndexExpr | null {
    return this.parseAttribute() || this.parseSliceSelector()
  }

  parseLiteralValue(): StringExpr | BooleanExpr | NumberExpr | null {
    const literalString = this.match({type: 'quoted', quote: 'double'})
    if (literalString && literalString.type === 'quoted') {
      return {
        type: 'string',
        value: literalString.value || '',
      }
    }
    const literalBoolean = this.match({type: 'boolean'})
    if (literalBoolean && literalBoolean.type === 'boolean') {
      return {
        type: 'boolean',
        value: literalBoolean.symbol === 'true',
      }
    }
    return this.parseNumber()
  }

  // TODO: Reorder constraints so that literal value is always on rhs, and variable is always
  // on lhs.
  parseFilterExpression(): ConstraintExpr | null {
    const start = this.i
    const expr = this.parseAttribute() || this.parseAlias()
    if (!expr) {
      return null
    }

    if (this.match({type: 'operator', symbol: '?'})) {
      return {
        type: 'constraint',
        operator: '?',
        lhs: expr,
      }
    }

    const binOp = this.match({type: 'comparator'})
    if (!binOp || binOp.type !== 'comparator') {
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
      rhs: rhs,
    }
  }

  parseExpression(): ConstraintExpr | AttributeExpr | RangeExpr | IndexExpr | null {
    return this.parseFilterExpression() || this.parseValueReference()
  }

  parseUnion(): UnionExpr | null {
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
      nodes: terms,
    }
  }

  parseRecursive(): RecursiveExpr | null {
    if (!this.match({type: 'operator', symbol: '..'})) {
      return null
    }

    const subpath = this.parsePath()
    if (!subpath) {
      throw new Error("Expected path following '..' operator")
    }

    return {
      type: 'recursive',
      term: subpath,
    }
  }

  parsePath(): PathExpr | AttributeExpr | UnionExpr | RecursiveExpr | null {
    const nodes: (AttributeExpr | UnionExpr | RecursiveExpr)[] = []
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

    if (nodes.length === 1) {
      return nodes[0]
    }

    return {
      type: 'path',
      nodes: nodes,
    }
  }
}

export function parseJsonPath(path: string): PathExpr | AttributeExpr | UnionExpr | RecursiveExpr {
  const parsed = new Parser(path).parse()
  if (!parsed) {
    throw new Error(`Failed to parse JSON path "${path}"`)
  }
  return parsed
}
