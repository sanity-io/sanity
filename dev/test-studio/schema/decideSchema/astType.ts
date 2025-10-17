export type CompareOp =
  | 'eq'
  | 'neq'
  | 'in'
  | 'nin'
  | 'contains'
  | 'ncontains'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'exists'
  | 'empty'

export type CmpExpr = {
  _type: 'expr'
  _key: string
  kind: 'cmp'
  attr?: string // e.g. "audience", "language", "age", "locales"
  op?: CompareOp
  value?: string | number | boolean | string[] | number[]
  // optional type hints to aid validation & UI
  type?: 'string' | 'number' | 'boolean' | 'set<string>' | 'set<number>'
}

export type AndExpr = {_type: 'expr'; _key: string; kind: 'and'; exprs: Expr[]}
export type OrExpr = {_type: 'expr'; _key: string; kind: 'or'; exprs: Expr[]}
export type NotExpr = {_type: 'expr'; _key: string; kind: 'not'; expr: Expr}
// Canonical, UI-agnostic model
export type Expr = AndExpr | OrExpr | NotExpr | CmpExpr

// Helper type guards
export function isAndExpr(expr: Expr): expr is AndExpr {
  return expr.kind === 'and'
}

export function isOrExpr(expr: Expr): expr is OrExpr {
  return expr.kind === 'or'
}

export function isNotExpr(expr: Expr): expr is NotExpr {
  return expr.kind === 'not'
}

export function isCmpExpr(expr: Expr): expr is CmpExpr {
  return expr.kind === 'cmp'
}

// Variant selection (still first-match-wins unless you add weights)
export type Variant<T = unknown> = {
  _key: string
  _type: 'variant'
  value: T
  when: Expr // any boolean expression
}

export type Decide<T = unknown> = {
  default?: T
  _type: 'sanity.decideField'
  variants: Variant<T>[]
}
