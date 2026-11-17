import {css} from '#styled-system/css'

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  // The menu inset: 8px on every side, between the panel's edge and the rows
  padding: '8px',
  width: '400px',
  maxWidth: '100vw',
  boxSizing: 'border-box',
})

/** An audience row's subtitle: the lead, then the detail, on one line. */
export const audienceLine = css({
  display: 'flex',
  minWidth: 0,
  whiteSpace: 'nowrap',
})

/** The lead and its date always show: it never shrinks below its text, only to the row's width. */
export const audienceLead = css({
  flex: '0 0 auto',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

/** The detail is cut short first when the line is too long. */
export const audienceDetail = css({
  flex: '0 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

/** Keeps the spaces around the dot between the lead and the detail. */
export const audienceSeparator = css({
  whiteSpace: 'pre',
})
