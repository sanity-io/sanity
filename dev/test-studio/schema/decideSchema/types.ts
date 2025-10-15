export interface DecideObject<T = unknown> {
  _type: 'sanity.decideField'
  default?: T
  variants?: Array<{
    _key: string
    _type: 'variant'
    value?: T
    anyOf?: Array<DecideRule>
  }>
}

export interface DecideRule {
  property: string
  operator: string
  targetValue: string
  and?: DecideRule[]
  _key: string
  _type: 'rule'
}
