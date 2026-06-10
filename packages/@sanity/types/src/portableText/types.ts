/** @public */

export type PortableTextBlock = PortableTextTextBlock | PortableTextObject

/** @public */
export interface PortableTextTextBlock<TChild = PortableTextSpan | PortableTextObject> {
  _type: string
  _key: string
  children: TChild[]
  markDefs?: PortableTextObject[]
  listItem?: string
  style?: string
  level?: number
}

/** @public */
export interface PortableTextObject {
  _type: string
  _key: string
  [other: string]: unknown
}

/** @public */
export interface PortableTextSpan {
  _key: string
  _type: 'span'
  text: string
  marks?: string[]
}

/** @public */
export type PortableTextChild = PortableTextObject | PortableTextSpan

/** @public */
export interface PortableTextListBlock extends PortableTextTextBlock {
  listItem: string
  level: number
}
