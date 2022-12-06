/** @internal */

export type PortableTextBlock = PortableTextTextBlock | PortableTextObject

/** @internal */
export interface PortableTextTextBlock<TChild = PortableTextSpan | PortableTextObject> {
  _type: string
  _key: string
  children: TChild[]
  markDefs?: PortableTextObject[]
  listItem?: string
  style?: string
  level?: number
}

/** @internal */
export interface PortableTextObject {
  _type: string
  _key: string
  [other: string]: unknown
}

/** @internal */
export interface PortableTextSpan {
  _key: string
  _type: 'span'
  text: string
  marks?: string[]
}

/** @internal */
export type PortableTextChild = PortableTextObject | PortableTextSpan

/** @internal */
export interface PortableTextListBlock extends PortableTextTextBlock {
  listItem: string
  level: number
}
