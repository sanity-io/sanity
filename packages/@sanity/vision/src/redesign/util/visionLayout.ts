import {type VisionLayout} from '../store/VisionActorContext'

/** The collapsed sidebar rail's width (`.sidebarRailCollapsed` in `redesign.module.css`) */
export const COLLAPSED_RAIL_WIDTH = 49

/**
 * Below this width of the tool, one column shows at a time and the sidebar floats over the
 * content. Measured on the whole tool rather than the tabs area: the floating sidebar gives the
 * tabs area its room back, which would switch straight back out of the phone layout.
 */
export const MOBILE_BREAKPOINT = 600

/**
 * Below this width of the tabs area beside the sidebar, the request and response columns stack.
 * With the rail collapsed and no drawer open it is a 900px wide tool; an expanded rail or an open
 * drawer stacks the columns in a wider one, as narrowing the window would.
 */
export const STACKED_BREAKPOINT = 900 - COLLAPSED_RAIL_WIDTH

export interface VisionLayoutWidths {
  /** The whole tool, sidebar included */
  tool: number
  /** The tabs area: what the sidebar rail and any drawer beside it leave over */
  tabs: number
}

export function getVisionLayout({tool, tabs}: VisionLayoutWidths): VisionLayout {
  if (tool < MOBILE_BREAKPOINT) return 'mobile'
  if (tabs < STACKED_BREAKPOINT) return 'stacked'
  return 'columns'
}

/**
 * The widths to lay out by before the tool has been measured. `useContentSize` measures before
 * the first paint, so this only decides which layout the first render mounts, and a close guess
 * spares mounting the other one's editors just to replace them.
 */
export function estimateVisionLayoutWidths(): VisionLayoutWidths {
  const tool =
    typeof window === 'undefined' ? STACKED_BREAKPOINT + COLLAPSED_RAIL_WIDTH : window.innerWidth
  return {tool, tabs: tool - COLLAPSED_RAIL_WIDTH}
}
