import {createContainer, style} from '@vanilla-extract/css'

/**
 * The navbar root is a size query container, so the grid below adapts to the navbar's own inline
 * size rather than the viewport's. The two differ whenever the studio does not fill the window:
 * the Themer split preview renders two studios side by side, and an embedded studio shares the
 * page with whatever hosts it. A navbar that is half the window wide lays out like the navbar of
 * a window half as wide.
 *
 * The container is the navbar's `Card`, whose content box is what the queries measure.
 * `container-type: inline-size` also applies layout containment, which is why the overlays the
 * navbar opens (search, menus, popovers) render through portals rather than as positioned
 * descendants; the `NavDrawer` is a sibling of the container for the same reason.
 */
const navbarContainer = createContainer()

export const navbar = style({
  containerName: navbarContainer,
  containerType: 'inline-size',
})

/**
 * The navbar's three columns: the left cluster (home, workspace, new document, search), the tool
 * menu, and the right cluster (search, releases, presence, help, user).
 *
 * The tool menu is the column that must give way. `CollapseTabList` moves the tools that do not
 * fit its own width into an overflow menu, which only works if its column is allowed to shrink
 * below the natural width of the tools.
 */
export const navGrid = style({
  // The side clusters take their content width and the tools take whatever is left.
  'gridTemplateColumns': 'auto minmax(0, 1fr) auto',
  '@container': {
    // A wide navbar (1800px was the viewport breakpoint, media[4], this rule used before it
    // queried the container) centers the tools on the navbar: the side columns flex equally around
    // a content-sized tools column. A bare `1fr` is `minmax(auto, 1fr)`, and that `auto` resolves
    // to the side cluster's `min-width`, which ui5 Flex sets to 0. With no floor, an `auto` tools
    // column wider than the leftover space collapses the side columns to nothing before it shrinks
    // by a single pixel; the `max-content` floor keeps the side clusters intact so the tools
    // column, and its overflow menu, absorb the shortfall when the tools outgrow even a wide navbar.
    [`${navbarContainer} (min-width: 1800px)`]: {
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
