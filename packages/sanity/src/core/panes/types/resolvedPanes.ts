import {type LOADING_PANE} from '../constants'

/**
 * Data for a single resolved pane, as provided by the host tool's pane
 * resolver. The `pane` node is typed minimally here: the structure tool works
 * with its full resolved pane node union, while core pane components only
 * need the pane type discriminator and the positional data.
 *
 * @internal
 */
export interface ResolvedPaneData {
  active: boolean
  childItemId: string | null
  groupIndex: number
  index: number
  itemId: string
  key: string
  pane: {type: string} | typeof LOADING_PANE
  params: Record<string, string | undefined> & {perspective?: string}
  path: string
  payload: unknown
  selected: boolean
  siblingIndex: number
  maximized: boolean
}

/**
 * The resolved panes for the current pane layout, as read by core pane
 * components. The structure tool provides this from its structure resolver;
 * hosts without a pane resolver (e.g. presentation) do not provide it and the
 * default empty value applies.
 *
 * @internal
 */
export interface ResolvedPanes {
  paneDataItems: ResolvedPaneData[]
  maximizedPane: ResolvedPaneData | null
}
