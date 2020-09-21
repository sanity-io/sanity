export interface Block<O = Span> {
  _type: 'block'
  _key: string
  style: string
  children: O[]
  markDefs: MarkDefinition[]
}

export interface Span {
  _type: 'span'
  _key: string
  marks: string[]
  text: string
}

export interface MarkDefinition {
  [key: string]: unknown
  _type: string
  _key: string
}
