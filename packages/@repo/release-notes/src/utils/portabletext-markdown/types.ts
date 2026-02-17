type PortableTextStyle = 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'blockquote'
type PortableTextListItem = 'number' | 'bullet'
type PortableTextDecorator = 'strong' | 'em' | 'code' | 'strike-through'

type PortableTextSpan = {
  _type: 'span'
  _key: string
  text: string
  marks?: PortableTextDecorator[]
}

export type PortableTextLink = {
  _type: 'link'
  _key: string
  href: string
  title?: string
}

export type PortableTextBlock = {
  _type: 'block'
  _key: string
  style?: PortableTextStyle
  level?: number
  markDefs: ({
    _key: string
    _type: string
  } & Record<string, unknown>)[]
  listItem?: PortableTextListItem
  children: (PortableTextSpan | PortableTextImage | PortableTextCode | PortableTextLink)[]
}

export type PortableTextCode = {
  _type: 'code'
  _key: string
  language?: string
  code: string
}

export type PortableTextImage = {
  _type: 'image'
  _key: string
  src: string
  alt?: string
  title?: string
}

export type PortableTextHorizontalRule = {
  _type: 'horizontal-rule'
  _key: string
}

export type PortableTextHtml = {
  _type: 'html'
  _key: string
  html: string
}

export type PortableTextTable = {
  _type: 'table'
  _key: string
  headerRows?: number
  rows: unknown[]
}

export type PortableTextMarkdownBlock =
  | PortableTextBlock
  | PortableTextCode
  | PortableTextImage
  | PortableTextHorizontalRule
  | PortableTextHtml
  | PortableTextTable
