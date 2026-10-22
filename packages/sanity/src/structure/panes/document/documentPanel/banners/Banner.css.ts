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
  // A fixed 16px between the text and the action (Faheem, 23 Oct).
  'gap': 16,
  'paddingLeft': 8,
  'paddingRight': 8,
  '@container': {
    [`${banner} (max-width: ${NARROW}px)`]: {
      flexWrap: 'wrap',
    },
  },
})

/** The icon and the text: at most 720px (Faheem, 23 Oct: 560 wrapped too eagerly in wide panes), and it shrinks first when the pane is narrow. */
export const text = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  flex: '0 1 720px',
  minWidth: 0,
  maxWidth: 720,
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
  // Two lines split into roughly equal lines, not a full line and a short tail (a progressive enhancement: browsers without it wrap as
  // before). Inherited by the text.
  textWrap: 'balance',
})

/**
 * The action column hugs its button, 16px after the text (the row's gap); it is pushed to the right edge when the banner is wider than
 * the text's cap, the gap and the button. A banner with no action has no column, and its text takes the whole width up to its cap. On a
 * narrow banner the action goes under the text, left aligned.
 */
export const action = style({
  'display': 'flex',
  'alignItems': 'center',
  'flex': 'none',
  'marginLeft': 'auto',
  '@container': {
    [`${banner} (max-width: ${NARROW}px)`]: {
      flexBasis: '100%',
      justifyContent: 'flex-start',
      marginLeft: 0,
      paddingBottom: 8,
    },
  },
})
