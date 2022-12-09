/** @alpha */

export type PortableTextBlock = PortableTextTextBlock | PortableTextObject

/** @alpha */
export interface PortableTextTextBlock<TChild = PortableTextSpan | PortableTextObject> {
  _type: string
  _key: string
  children: TChild[]
  markDefs?: PortableTextObject[]
  listItem?: string
  style?: string
  level?: number
}

/** @alpha */
export interface PortableTextObject {
  _type: string
  _key: string
  [other: string]: unknown
}

/** @alpha */
export interface PortableTextSpan {
  _key: string
  _type: 'span'
  text: string
  marks?: string[]
}

/** @alpha */
export type PortableTextChild = PortableTextObject | PortableTextSpan

/** @alpha */
export interface PortableTextListBlock extends PortableTextTextBlock {
  listItem: string
  level: number
}
