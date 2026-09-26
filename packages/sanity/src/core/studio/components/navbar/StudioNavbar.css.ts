import {style} from '@vanilla-extract/css'

/**
 * The navbar's three columns: the left cluster (home, workspace, new document, search), the tool
 * menu, and the right cluster (search, releases, presence, help, user).
 *
 * The tool menu is the column that must give way. `CollapseTabList` moves the tools that do not
 * fit its own width into an overflow menu, which only works if its column is allowed to shrink
 * below the natural width of the tools.
 */
export const navGrid = style({
  'gridTemplateColumns': 'auto minmax(0, 1fr) auto',
  '@media': {
    // media[4]. On wide viewports the tools are centered on the page: the side columns flex equally
    // around a content-sized tools column. A bare `1fr` is `minmax(auto, 1fr)`, and that `auto`
    // resolves to the side cluster's `min-width`, which ui5 Flex sets to 0. With no floor, an `auto`
    // tools column wider than the leftover space collapses the side columns to nothing before it
    // shrinks by a single pixel — the failure mode whenever the studio is narrower than the
    // viewport (the Themer split preview, an embedded studio). The `max-content` floor keeps the
    // side clusters intact so the tools column, and its overflow menu, absorb the shortfall.
    'screen and (min-width: 1800px)': {
      gridTemplateColumns: 'minmax(max-content, 1fr) auto minmax(max-content, 1fr)',
    },
  },
})

/**
 * The tools column. `min-width: 0` lets its grid track shrink below the tools' natural width, and
 * `overflow: hidden` keeps tools that have not yet moved into the overflow menu from spilling over
 * the side clusters.
 */
export const navTools = style({
  minWidth: 0,
  overflow: 'hidden',
})
