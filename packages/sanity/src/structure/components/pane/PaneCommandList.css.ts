import {css} from '#styled-system/css'

/**
 * Scroller of the `CommandList` rendered by the list panes (`ListPaneContent`,
 * `DocumentListPaneContent`). Pair it with `paddingLeft={3}`; this class owns the right edge.
 *
 * The studio styles `::-webkit-scrollbar` (`GlobalStyle`), so WebKit and Blink always draw a
 * classic, space-taking scrollbar of `SCROLLBAR_SIZE` (12px) — the same width as `space[3]`,
 * the horizontal list padding. Added next to a right padding, that scrollbar made the items of
 * an overflowing list end 24px from the pane edge while a non-overflowing list ended at 12px.
 * Keeping the scrollbar's track there whether or not the list scrolls, and dropping the right
 * padding, lets that strip double as the right-hand spacing: items end 12px from the edge either
 * way, and nothing shifts when the list grows. A non-scrollable track paints nothing — the
 * studio's track is transparent and the thumb is left out — so the strip reads as empty space.
 *
 * `overflow-y: scroll` rather than `scrollbar-gutter: stable` because WebKit sizes the gutter from
 * the platform scrollbar, which is an overlay on macOS, and reserves nothing for a styled
 * `::-webkit-scrollbar` — it would drop the padding without reserving the strip. Firefox ignores
 * `::-webkit-scrollbar` (its scrollbar width is platform dependent and may be an overlay), so it
 * keeps the plain `space[3]` padding and `overflow-y: auto`.
 */
export const paneCommandList = css({
  'paddingRight': 'var(--space-3)',

  // Doubled class so `overflow-y` beats `CommandList`'s own `overflow-y: auto`, which
  // styled-components injects as a single class after this stylesheet
  '&&': {
    '@supports selector(::-webkit-scrollbar)': {
      overflowY: 'scroll',
      paddingRight: 0,
    },
  },
})
