import {StructureContext} from '../structureBuilder'
import {PaneNode} from './pane'

/**
 * Represents the state of the `panes` inside the desk-tool router
 *
 * - The desk tool stores the state of the current panes inside of the router.
 * - The panes are stored in groups delimited in the URL by `;`.
 * - In each group, there can be one or more sibling (aka split) panes delimited
 *   by `|`.
 * - Each item pane can contain it's own parameters and payloads
 * - Per item pane in each group, if not specified separately, the ID, params,
 *   and payload will be inherited from the first item pane in the pane group
 *   (unless it's an `exclusiveParam`)
 *
 * E.g. `/desk/books;book-123|,view=preview` will parse to:
 *
 * ```js
 * [
 *   // first pane group
 *   [{id: 'book'}],
 *
 *   // second pane group
 *   [
 *     [
 *       // first pane item
 *       {id: 'book-123'},
 *       // second pane item
 *       {id: 'book-123', params: {view: 'preview'}},
 *     ],
 *   ],
 * ]
 * ```
 *
 * see [`packages/@sanity/desk-tool/src/utils/parsePanesSegment.ts`][0]
 *
 * [0]: https://github.com/sanity-io/sanity/blob/287d308442938c98cbec4608d159401631792d7a/packages/%40sanity/desk-tool/src/utils/parsePanesSegment.ts#L71-L88
 */
export type RouterPanes = RouterPaneGroup[]

/**
 * Represents a "pane group" in the router.
 *
 * @see RouterPanes
 */
export type RouterPaneGroup = RouterPaneSibling[]

/**
 * Represents a "sibling pane" or "split pane" in the router.
 *
 * @see RouterPanes
 */
export interface RouterPaneSibling {
  id: string
  params?: Record<string, string | undefined>
  payload?: unknown
}

// TODO: unify this with the structure builder ChildResolver type
/**
 * Passed as the second argument to the item of resolving pane children
 *
 * @see RouterPanes
 */
export interface RouterPaneSiblingContext {
  id: string
  parent: PaneNode | null
  index: number
  splitIndex: number
  path: string[]
  params: Record<string, string | undefined>
  payload: unknown
  structureContext: StructureContext
  // used in structure builder
  serializeOptions?: {
    path: (string | number)[]
    index?: number
    hint?: string
  }
}
