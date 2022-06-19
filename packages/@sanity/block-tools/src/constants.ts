import {uniq} from 'lodash'

export interface PartialBlock {
  _type: string
  markDefs: string[]
  style: string
  level?: number
  listItem?: string
}

export const BLOCK_DEFAULT_STYLE = 'normal'

export const DEFAULT_BLOCK: PartialBlock = Object.freeze({
  _type: 'block',
  markDefs: [],
  style: BLOCK_DEFAULT_STYLE,
})

export const DEFAULT_SPAN = Object.freeze({
  _type: 'span',
  marks: [] as string[],
})

export const HTML_BLOCK_TAGS = {
  p: DEFAULT_BLOCK,
  blockquote: {...DEFAULT_BLOCK, style: 'blockquote'} as PartialBlock,
}

export const HTML_SPAN_TAGS = {
  span: {object: 'text'},
}

export const HTML_LIST_CONTAINER_TAGS: Record<string, {object: null} | undefined> = {
  ol: {object: null},
  ul: {object: null},
}

export const HTML_HEADER_TAGS: Record<string, PartialBlock | undefined> = {
  h1: {...DEFAULT_BLOCK, style: 'h1'},
  h2: {...DEFAULT_BLOCK, style: 'h2'},
  h3: {...DEFAULT_BLOCK, style: 'h3'},
  h4: {...DEFAULT_BLOCK, style: 'h4'},
  h5: {...DEFAULT_BLOCK, style: 'h5'},
  h6: {...DEFAULT_BLOCK, style: 'h6'},
}

export const HTML_MISC_TAGS = {
  br: {...DEFAULT_BLOCK, style: BLOCK_DEFAULT_STYLE} as PartialBlock,
}

export const HTML_DECORATOR_TAGS: Record<string, string | undefined> = {
  b: 'strong',
  strong: 'strong',

  i: 'em',
  em: 'em',

  u: 'underline',
  s: 'strike-through',
  strike: 'strike-through',
  del: 'strike-through',

  code: 'code',
}

export const HTML_LIST_ITEM_TAGS: Record<string, PartialBlock | undefined> = {
  li: {
    ...DEFAULT_BLOCK,
    style: BLOCK_DEFAULT_STYLE,
    level: 1,
    listItem: 'bullet',
  },
}

export const ELEMENT_MAP = {
  ...HTML_BLOCK_TAGS,
  ...HTML_SPAN_TAGS,
  ...HTML_LIST_CONTAINER_TAGS,
  ...HTML_LIST_ITEM_TAGS,
  ...HTML_HEADER_TAGS,
  ...HTML_MISC_TAGS,
}

export const DEFAULT_SUPPORTED_STYLES = uniq(
  Object.values(ELEMENT_MAP)
    .filter((tag): tag is PartialBlock => 'style' in tag)
    .map((tag) => tag.style)
)

export const DEFAULT_SUPPORTED_DECORATORS = uniq(Object.values(HTML_DECORATOR_TAGS))

export const DEFAULT_SUPPORTED_ANNOTATIONS = ['link']
