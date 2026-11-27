import {addTransitionType, startTransition, type ViewTransitionClassPerType} from 'react'
import {
  STUDIO_RESIZE_TRANSITION_TYPE,
  STUDIO_SKIP_TRANSITION_TYPE,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1'

/** Collapsing, expanding or fitting a bottom panel */
export const PANEL_TRANSITION = 'vision-panel'
/** Expanding or collapsing the sidebar rail, or opening, closing or switching a drawer */
export const SIDEBAR_TRANSITION = 'vision-sidebar'

type LayoutTransitionType = typeof PANEL_TRANSITION | typeof SIDEBAR_TRANSITION

/**
 * Runs a layout change as a typed transition, so the `<ViewTransition>` boundaries that opt in to
 * that type animate it (the styles are in `styles.css`). Only discrete changes go through here:
 * dragging or arrowing a divider updates synchronously and never animates.
 */
export function startLayoutTransition(type: LayoutTransitionType, update: () => void): void {
  startTransition(() => {
    addTransitionType(type)
    addTransitionType(STUDIO_RESIZE_TRANSITION_TYPE)
    update()
  })
}

/*
 * The boundaries' classes are keyed by transition type, with `none` for every other type: a
 * transition elsewhere in the studio, including a resize, leaves these panes out of its snapshot.
 * A transition that skips the studio's boundaries leaves them out even of Vision's own types.
 */
function paneClass(type: LayoutTransitionType, className: string): ViewTransitionClassPerType {
  return {default: 'none', [type]: className, [STUDIO_SKIP_TRANSITION_TYPE]: 'none'}
}

/** A pane that resizes when a bottom panel collapses, expands or fits its content */
export const PANEL_PANE = paneClass(PANEL_TRANSITION, 'vision-pane')
/** The rail, which grows or shrinks, and a drawer, swapped for a wider or narrower one */
export const SIDEBAR_PANE = paneClass(SIDEBAR_TRANSITION, 'vision-pane')
/** The tabs area, which gives up or takes back the width of the rail and a drawer */
export const TABS_AREA = paneClass(SIDEBAR_TRANSITION, 'vision-tabs-area')
export const DRAWER_ENTER = paneClass(SIDEBAR_TRANSITION, 'vision-drawer-enter')
export const DRAWER_EXIT = paneClass(SIDEBAR_TRANSITION, 'vision-drawer-exit')
