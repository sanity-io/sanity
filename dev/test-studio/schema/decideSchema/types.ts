export interface DecideObject<T = unknown> {
  default?: T
  conditions?: Array<{
    _key: string
    _type: 'condition'
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
