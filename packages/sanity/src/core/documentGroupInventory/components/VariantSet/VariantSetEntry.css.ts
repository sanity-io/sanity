import {css} from '#styled-system/css'

/** `${space[3]}px` */
export const space3Var = '--variant-set-entry-space-3'

export const variantSetEntry = css({
  'position': 'relative',
  'padding': `var(${space3Var})`,
  'wordBreak': 'break-all',
  'justifyContent': 'space-between',
  'display': 'flex',
  'gap': `var(${space3Var})`,
  'alignItems': 'center',
  '* + &': {
    borderBlockStart: '1px solid var(--card-border-color)',
  },
  '&:hover, &:focus-within': {
    backgroundColor: 'var(--card-muted-bg-color)',
  },
  // `&&`: the checked background wins over the hover one, which it followed
  '&&:has(:checked)': {
    backgroundColor: 'var(--card-focus-ring-color)',
  },
  // `.atom`, `.inert` and `.primary-action` are string classes set by DocumentGroupEntry
  '& .atom': {
    display: 'flex',
    gap: `var(${space3Var})`,
    alignItems: 'center',
  },
  '& .inert': {
    pointerEvents: 'none',
  },
  '& .primary-action': {
    appearance: 'none',
    position: 'absolute',
    margin: 0,
    padding: 0,
    border: 0,
    background: 'none',
    inset: 0,
    opacity: 0,
  },
})
