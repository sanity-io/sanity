// TODO: Import from @sanity/client once available

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

export type Variant<T = unknown> = {
  _key: string
  _type: 'variant'
  value?: T
  when: Expr
}

export type Decide<T = unknown> = {
  default?: T
  _type: 'sanity.decideField'
  variants: Variant<T>[]
}

export const exampleDecide: Decide = {
  _type: 'sanity.decideField',
  default: 'Default value',
  variants: [
    {
      _key: '0a70e4200e5f',
      _type: 'variant',
      when: {
        _type: 'expr',
        _key: 'cd42767f-b9aa-4250-89b4-9a3e335f7531',
        exprs: [
          {
            _key: 'cd42767f-b9aa-4250-89b4-9a3e335f7531',
            _type: 'expr',
            exprs: [
              {
                _key: 'ec33615969f2',
                _type: 'expr',
                kind: 'cmp',
                attr: 'audiences',
                op: 'neq',
                value: 'aud-a',
              },
            ],
            kind: 'and',
          },
        ],
        kind: 'or',
      },
    },
  ],
}
