import {css} from '#styled-system/css'

/** Hairline between the variants menu and the badges after it. */
export const menuDivider = css({
  width: '1px',
  alignSelf: 'stretch',
  marginInline: '8px',
  marginBlock: '6px',
  flexShrink: 0,
  backgroundColor: 'var(--card-border-color)',
})

/** The version count and its glyph at the end of a menu item. */
export const versionCount = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  color: 'var(--card-muted-fg-color)',
})
