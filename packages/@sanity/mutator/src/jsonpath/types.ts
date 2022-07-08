import type {Expression} from './Expression'

export type SymbolClass = 'boolean' | 'operator' | 'comparator' | 'keyword' | 'paren'

export interface QuotedToken {
  type: 'quoted'
  quote: 'double' | 'single'
  value: string | null
}

export interface IdentifierToken {
  type: 'identifier'
  name: string
}

export interface NumberToken {
  type: 'number'
  value: number
  raw: string
}

export interface SymbolToken {
  type: SymbolClass
  symbol: string
}

export type Token = QuotedToken | IdentifierToken | NumberToken | SymbolToken

export type Expr =
  | UnionExpr
  | PathExpr
  | ConstraintExpr
  | RecursiveExpr
  | IndexExpr
  | AttributeExpr
  | AliasExpr
  | RangeExpr
  | StringExpr
  | BooleanExpr
  | NumberExpr

export interface UnionExpr {
  type: 'union'
  nodes: Expr[]
}

export interface PathExpr {
  type: 'path'
  nodes: Expr[]
}

export interface ConstraintExpr {
  type: 'constraint'
  operator: string
  lhs: Expr
  rhs?: Expr
}

export interface RecursiveExpr {
  type: 'recursive'
  term: Expr
}

export interface IndexExpr {
  type: 'index'
  value: number
}

export interface AttributeExpr {
  type: 'attribute'
  name: string
}

export interface AliasExpr {
  type: 'alias'
  target: 'self'
}

export interface RangeExpr {
  type: 'range'
  start: number | null
  end: number | null
  step?: number | null
}

export interface StringExpr {
  type: 'string'
  value: string
}

export interface NumberExpr {
  type: 'number'
  value: number
}

export interface BooleanExpr {
  type: 'boolean'
  value: boolean
}

export interface HeadTail {
  head: Expression | null
  tail: Expression | null
}
