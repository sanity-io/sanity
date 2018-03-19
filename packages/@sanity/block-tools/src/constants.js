import {uniq} from 'lodash'

export const BLOCK_DEFAULT_STYLE = 'normal'

// Slate block
export const SLATE_DEFAULT_BLOCK = Object.freeze({
  object: 'block',
  type: 'contentBlock',
  data: {
    style: BLOCK_DEFAULT_STYLE
  }
})

export const DEFAULT_BLOCK = Object.freeze({
  _type: 'block',
  markDefs: [],
  style: BLOCK_DEFAULT_STYLE
})

export const DEFAULT_SPAN = Object.freeze({
  _type: 'span',
  marks: []
})

export const HTML_BLOCK_TAGS = {
  p: DEFAULT_BLOCK,
  blockquote: {...DEFAULT_BLOCK, style: 'blockquote'}
}

export const HTML_SPAN_TAGS = {
  span: {object: 'text'}
}

export const HTML_LIST_CONTAINER_TAGS = {
  ol: {object: null},
  ul: {object: null}
}

export const HTML_HEADER_TAGS = {
  h1: {...DEFAULT_BLOCK, style: 'h1'},
  h2: {...DEFAULT_BLOCK, style: 'h2'},
  h3: {...DEFAULT_BLOCK, style: 'h3'},
  h4: {...DEFAULT_BLOCK, style: 'h4'},
  h5: {...DEFAULT_BLOCK, style: 'h5'},
  h6: {...DEFAULT_BLOCK, style: 'h6'}
}

export const HTML_MISC_TAGS = {
  br: {...DEFAULT_BLOCK, style: 'normal'}
}
export const HTML_DECORATOR_TAGS = {
  b: 'strong',
  strong: 'strong',

  i: 'em',
  em: 'em',

  u: 'underline',
  s: 'strike-through',
  strike: 'strike-through',
  del: 'strike-through',

  code: 'code'
}

export const HTML_LIST_ITEM_TAGS = {
  li: {
    ...DEFAULT_BLOCK,
    style: 'normal',
    level: 1,
    listItem: 'bullet'
  }
}

export const ELEMENT_MAP = {
  ...HTML_BLOCK_TAGS,
  ...HTML_SPAN_TAGS,
  ...HTML_LIST_CONTAINER_TAGS,
  ...HTML_LIST_ITEM_TAGS,
  ...HTML_HEADER_TAGS,
  ...HTML_MISC_TAGS
}

export const DEFAULT_SUPPORTED_STYLES = uniq(
  Object.keys(ELEMENT_MAP)
    .filter(tag => ELEMENT_MAP[tag].style)
    .map(tag => ELEMENT_MAP[tag].style)
)

export const DEFAULT_SUPPORTED_DECORATORS = uniq(
  Object.keys(HTML_DECORATOR_TAGS).map(tag => HTML_DECORATOR_TAGS[tag])
)

export const DEFAULT_SUPPORTED_ANNOTATIONS = ['link']
