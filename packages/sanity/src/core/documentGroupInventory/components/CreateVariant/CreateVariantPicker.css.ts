import {css} from '#styled-system/css'

/**
 * Note: this UI is based on other instances of filterable menus in the
 * codebase. This UI is likely to be refactored shortly, so it's not worth
 * establishing a new abstraction.
 */
export const createVariantPickerMenu = css({
  '&&&': {
    minWidth: 'min(280px, calc(100vw - 24px))',
    maxWidth: 'min(360px, calc(100vw - 24px))',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    maxHeight: '100%',
    overflow: 'hidden',
  },
  '&&& > [data-ui="Stack"]': {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    gap: 0,
    overflow: 'hidden',
  },
})

/**
 * PROPOSED: the glyph of an empty select in the inset form is muted, whatever colour the glyph owns (a variant mark paints itself in the variant
 * tone; the spec wants `--card-muted-fg-color` on its colour, `--icon-color` and `--card-icon-color` until a variant is picked).
 */
export const finalMutedGlyph = css({
  '&&, && [data-ui="VariantMark"]': {
    'color': 'var(--card-muted-fg-color)',
    '--icon-color': 'var(--card-muted-fg-color)',
    '--card-icon-color': 'var(--card-muted-fg-color)',
  },
})
