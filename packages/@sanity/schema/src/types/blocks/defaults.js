// todo:
const DEFAULT_INDENTATION_FIELD = {  // eslint-disable-line no-console
  name: 'indentation',
  title: 'Indentation',
  type: 'number'
}

export const DEFAULT_LINK_FIELD = {
  type: 'object',
  name: 'link',
  fields: [
    {
      name: 'href',
      type: 'url',
      title: 'Url'
    }
  ]
}

export const DEFAULT_TEXT_FIELD = {
  type: 'text',
  name: 'text',
  title: 'Text'
}

export const LIST_TYPES = {
  bullet: {title: 'Bullet', value: 'bullet'},
  numbered: {title: 'Numbered', value: 'number'}
}

export const DEFAULT_LIST_TYPES = [
  LIST_TYPES.bullet,
  LIST_TYPES.numbered,
]

export const BLOCK_STYLES = {
  normal: {title: 'Normal', value: 'normal'},
  h1: {title: 'Heading 1', value: 'h1'},
  h2: {title: 'H2', value: 'h2'},
  h3: {title: 'H3', value: 'h3'},
  h4: {title: 'H4', value: 'h4'},
  h5: {title: 'H5', value: 'h5'},
  h6: {title: 'H6', value: 'h6'},
  blockquote: {title: 'Quote', value: 'blockquote'}
}

export const DEFAULT_BLOCK_STYLES = [
  BLOCK_STYLES.normal,
  BLOCK_STYLES.h1,
  BLOCK_STYLES.h2,
  BLOCK_STYLES.h3,
  BLOCK_STYLES.h4,
  BLOCK_STYLES.h5,
  BLOCK_STYLES.h6,
  BLOCK_STYLES.blockquote
]

export const MARK_STRONG = {title: 'Strong', value: 'strong'}
export const MARK_EMPHASIS = {title: 'Emphasis', value: 'em'}
export const MARK_CODE = {title: 'Code', value: 'code'}
export const MARK_UNDERLINE = {title: 'Underline', value: 'underline'}
export const MARK_STRIKE = {title: 'Strike', value: 'strike-through'}

export const MARKS = {
  strong: MARK_STRONG,
  em: MARK_EMPHASIS,
  code: MARK_CODE,
  underline: MARK_UNDERLINE,
  strikeThrough: MARK_STRIKE
}

export const DEFAULT_MARKS = [
  MARKS.strong,
  MARKS.em,
  MARKS.code,
  MARKS.underline,
  MARKS.strikeThrough
]
