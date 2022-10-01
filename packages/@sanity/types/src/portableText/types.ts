/** @public */
export interface Block<TChild = Span> {
  _type: string
  _key: string
  style: string
  children: TChild[]
  markDefs: MarkDefinition[]
}

/** @public */
export interface Span {
  _type: 'span'
  _key: string
  marks: string[]
  text: string
}

/** @public */
export interface MarkDefinition {
  [key: string]: unknown
  _type: string
  _key: string
}
