// TODO: Import this from "@sanity/client"

const stringOperators = [
  'equals',
  'not-equals',
  'contains',
  'not-contains',
  'is-empty',
  'is-not-empty',
] as const

const numberOperators = [
  'equals',
  'not-equals',
  'is-empty',
  'is-not-empty',
  '>',
  '<',
  '>=',
  '<=',
] as const

/**
 * @internal
 */
export interface DecideField<T = unknown> {
  _type: 'sanity.decideField'
  default?: T
  variants?: Array<{_key: string; _type: 'variant'; value?: T; anyOf?: Array<DecideRule>}>
}

export type DecideRule =
  | {
      property: string
      operator: (typeof stringOperators)[number]
      targetValue: string
      and?: DecideRule[]
      _key: string
      _type: 'rule'
    }
  | {
      property: string
      operator: (typeof numberOperators)[number]
      targetValue: number
      and?: DecideRule[]
      _key: string
      _type: 'rule'
    }
