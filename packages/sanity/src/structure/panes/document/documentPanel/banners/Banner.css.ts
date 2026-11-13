import {css} from '#styled-system/css'

/** The banner's width, for the narrow layout (the pane's, not the viewport's). */
const banner = 'sanity-document-banner'

/** Below this banner width the action goes under the text, left aligned. */
const NARROW = 480

/** The container the narrow layout is measured on (a container query cannot style the element it measures). */
export const root = css({
  containerName: banner,
  containerType: 'inline-size',
})

export const row = css({
  display: 'flex',
  alignItems: 'center',
  // A fixed 16px between the text and the action (Faheem, 23 Oct).
  gap: '16px',
  paddingLeft: '8px',
  paddingRight: '8px',
  [`@container ${banner} (max-width: ${NARROW}px)`]: {
    flexWrap: 'wrap',
  },
})

/** The icon and the text: at most 720px (Faheem, 23 Oct: 560 wrapped too eagerly in wide panes), and it shrinks first when the pane is narrow. */
export const text = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  flex: '0 1 720px',
  minWidth: 0,
  maxWidth: '720px',
})

/** The icon, top aligned with the text's first line. 8px is UI 5's space-2, the nearest scale step to the 9px it was. */
export const icon = css({
  flex: 'none',
  paddingTop: '8px',
})

/** The text column: it wraps, in roughly equal lines (a progressive enhancement, inherited by the text). */
export const content = css({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px',
  flex: '1 1 0%',
  minWidth: 0,
  paddingTop: '8px',
  paddingBottom: '8px',
  textWrap: 'balance',
})

/**
 * The action column hugs its button, 16px after the text (the row's gap); it is pushed to the right edge when the banner is wider than
 * the text's cap, the gap and the button. A banner with no action has no column. On a narrow banner the action goes under the text.
 */
export const action = css({
  display: 'flex',
  alignItems: 'center',
  flex: 'none',
  marginLeft: 'auto',
  [`@container ${banner} (max-width: ${NARROW}px)`]: {
    flexBasis: '100%',
    justifyContent: 'flex-start',
    marginLeft: 0,
    paddingBottom: '8px',
  },
})

/** Several actions side by side; they wrap under each other when the column is too narrow. */
export const actionGroup = css({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px',
})
