import {addTransitionType, startTransition, type ViewTransitionClass} from 'react'

/** Collapsing, expanding or fitting a bottom panel */
export const PANEL_TRANSITION = 'vision-panel'
/** Opening, closing or switching a sidebar drawer */
export const DRAWER_TRANSITION = 'vision-drawer'

type LayoutTransitionType = typeof PANEL_TRANSITION | typeof DRAWER_TRANSITION

/**
 * Runs a layout change as a typed transition, so the `<ViewTransition>` boundaries that opt in to
 * that type animate it (the styles are in `styles.css`). Only discrete changes go through here:
 * dragging or arrowing a divider updates synchronously and never animates.
 */
export function startLayoutTransition(type: LayoutTransitionType, update: () => void): void {
  startTransition(() => {
    addTransitionType(type)
    update()
  })
}

/*
 * The boundaries' classes are keyed by transition type, with `none` for every other type: a
 * transition elsewhere in the studio leaves these panes out of its snapshot.
 */

/** A pane that resizes when a bottom panel collapses, expands or fits its content */
export const PANEL_PANE: ViewTransitionClass = {default: 'none', [PANEL_TRANSITION]: 'vision-pane'}
/** A drawer swapped for a wider or narrower one */
export const DRAWER_PANE: ViewTransitionClass = {
  default: 'none',
  [DRAWER_TRANSITION]: 'vision-pane',
}
/** The tabs area, which gives up or takes back the width of a drawer */
export const TABS_AREA: ViewTransitionClass = {
  default: 'none',
  [DRAWER_TRANSITION]: 'vision-tabs-area',
}
export const DRAWER_ENTER: ViewTransitionClass = {
  default: 'none',
  [DRAWER_TRANSITION]: 'vision-drawer-enter',
}
export const DRAWER_EXIT: ViewTransitionClass = {
  default: 'none',
  [DRAWER_TRANSITION]: 'vision-drawer-exit',
}
