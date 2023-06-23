export const DEFAULT_LINK_ANNOTATION = {
  type: 'object',
  name: 'link',
  options: {
    modal: {type: 'popover'},
  },
  fields: [
    {
      name: 'href',
      type: 'url',
      title: 'Url',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https', 'tel', 'mailto'],
          allowRelative: true,
        }),
    },
  ],
}

export const DEFAULT_TEXT_FIELD = {
  type: 'text',
  name: 'text',
  title: 'Text',
}

export const DEFAULT_MARKS_FIELD = {
  name: 'marks',
  type: 'array',
  of: [{type: 'string'}],
  title: 'Marks',
}

export const LIST_TYPES = {
  bullet: {title: 'Bulleted list', value: 'bullet'},
  numbered: {title: 'Numbered list', value: 'number'},
}

export const DEFAULT_LIST_TYPES = [LIST_TYPES.bullet, LIST_TYPES.numbered]

export const BLOCK_STYLES = {
  normal: {title: 'Normal', value: 'normal'},
  h1: {title: 'Heading 1', value: 'h1'},
  h2: {title: 'Heading 2', value: 'h2'},
  h3: {title: 'Heading 3', value: 'h3'},
  h4: {title: 'Heading 4', value: 'h4'},
  h5: {title: 'Heading 5', value: 'h5'},
  h6: {title: 'Heading 6', value: 'h6'},
  blockquote: {title: 'Quote', value: 'blockquote'},
}

export const DEFAULT_BLOCK_STYLES = [
  BLOCK_STYLES.normal,
  BLOCK_STYLES.h1,
  BLOCK_STYLES.h2,
  BLOCK_STYLES.h3,
  BLOCK_STYLES.h4,
  BLOCK_STYLES.h5,
  BLOCK_STYLES.h6,
  BLOCK_STYLES.blockquote,
]

export const DECORATOR_STRONG = {title: 'Strong', value: 'strong'}
export const DECORATOR_EMPHASIS = {title: 'Italic', value: 'em'}
export const DECORATOR_CODE = {title: 'Code', value: 'code'}
export const DECORATOR_UNDERLINE = {title: 'Underline', value: 'underline'}
export const DECORATOR_STRIKE = {title: 'Strike', value: 'strike-through'}

export const DECORATORS = {
  strong: DECORATOR_STRONG,
  em: DECORATOR_EMPHASIS,
  code: DECORATOR_CODE,
  underline: DECORATOR_UNDERLINE,
  strikeThrough: DECORATOR_STRIKE,
}

export const DEFAULT_DECORATORS = [
  DECORATORS.strong,
  DECORATORS.em,
  DECORATORS.code,
  DECORATORS.underline,
  DECORATORS.strikeThrough,
]
