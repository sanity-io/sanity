import {createContainer, style} from '@vanilla-extract/css'

/** The banner's width, for the narrow layout (the pane's, not the viewport's). */
const banner = createContainer()

/** Below this banner width the action goes under the text, left aligned. */
const NARROW = 480

/** The container the narrow layout is measured on (a container query cannot style the element it measures). */
export const root = style({
  containerName: banner,
  containerType: 'inline-size',
})

export const row = style({
  'display': 'flex',
  'alignItems': 'center',
  'gap': 12,
  'paddingLeft': 8,
  'paddingRight': 8,
  '@container': {
    [`${banner} (max-width: ${NARROW}px)`]: {
      flexWrap: 'wrap',
    },
  },
})

/** The icon and the text: at most 560px (about 60 characters at size 1), and it shrinks first when the pane is narrow. */
export const text = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  flex: '0 1 560px',
  minWidth: 0,
  maxWidth: 560,
})

/** The icon, top aligned with the text's first line. */
export const icon = style({
  flex: 'none',
  paddingTop: 9,
})

/** The text column: it wraps. */
export const content = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 8,
  flex: '1 1 0%',
  minWidth: 0,
  paddingTop: 8,
  paddingBottom: 8,
})

/** The space between the text and the action slot. */
export const spacer = style({
  'flex': '1 1 0%',
  '@container': {
    [`${banner} (max-width: ${NARROW}px)`]: {
      display: 'none',
    },
  },
})

/**
 * The action slot: a fixed column on the right, as wide as the widest action ("Back to All users"), the button right aligned and centred.
 * It is kept when a banner has no action, so the text and the right edge line up from one banner to the next. On a narrow banner it goes
 * under the text, left aligned.
 */
export const action = style({
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'flex-end',
  'flex': '0 0 auto',
  'minWidth': 150,
  '@container': {
    [`${banner} (max-width: ${NARROW}px)`]: {
      flexBasis: '100%',
      justifyContent: 'flex-start',
      minWidth: 0,
      paddingBottom: 8,
    },
  },
  'selectors': {
    // A banner with no action keeps its slot only while it is a column.
    '&:empty': {
      '@container': {
        [`${banner} (max-width: ${NARROW}px)`]: {display: 'none'},
      },
    },
  },
})
