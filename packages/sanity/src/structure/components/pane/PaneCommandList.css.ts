import {style} from '@vanilla-extract/css'

/**
 * Scroller of the `CommandList` rendered by the list panes (`ListPaneContent`,
 * `DocumentListPaneContent`). Pair it with `paddingLeft={3}`; this class owns the right edge.
 *
 * The studio styles `::-webkit-scrollbar` (`GlobalStyle`), so WebKit and Blink always draw a
 * classic, space-taking scrollbar of `SCROLLBAR_SIZE` (12px) — the same width as `space[3]`,
 * the horizontal list padding. Added next to a right padding, that scrollbar made the items of
 * an overflowing list end 24px from the pane edge while a non-overflowing list ended at 12px.
 * Reserving the gutter permanently and dropping the right padding lets the gutter double as the
 * right-hand spacing: items end 12px from the edge either way, and nothing shifts when the
 * scrollbar appears. Firefox ignores `::-webkit-scrollbar` (its scrollbar width is platform
 * dependent and may be an overlay), so it keeps the plain `space[3]` padding.
 */
export const paneCommandList = style({
  'paddingRight': 'var(--space-3)',
  '@supports': {
    'selector(::-webkit-scrollbar)': {
      scrollbarGutter: 'stable',
      paddingRight: 0,
    },
  },
})
