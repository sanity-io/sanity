import {ResponsivePaddingProps} from '@sanity/ui'

export const TEXT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export const TEXT_BULLET_MARKERS = ['●', '○', '■']

export const TEXT_NUMBER_FORMATS = ['number', 'lower-alpha', 'lower-roman']

export const TEXT_DECORATOR_TAGS: Record<string, React.ElementType> = {
  em: 'em',
  'strike-through': 's',
  underline: 'u',
  strong: 'strong',
  code: 'code',
}

export const TEXT_STYLE_PADDING: Record<string, ResponsivePaddingProps> = {
  h1: {
    paddingTop: 5,
    paddingBottom: 4,
  },
  h2: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  h3: {
    paddingTop: 4,
    paddingBottom: 3,
  },
  h4: {
    paddingTop: 4,
    paddingBottom: 3,
  },
  h5: {
    paddingTop: 4,
    paddingBottom: 3,
  },
  h6: {
    paddingTop: 4,
    paddingBottom: 2,
  },
  normal: {
    paddingTop: 2,
    paddingBottom: 3,
  },
  blockquote: {
    paddingTop: 2,
    paddingBottom: 3,
  },
}
