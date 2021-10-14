export type StructurePane = any

/**
 * Represents a "pane group" in the router.
 *
 * - The desk tool stores the state of the current panes inside of the router.
 * - The panes are stored in groups delimited in the URL by `;`.
 * - In each group, there can be one or more split view panes delimited by `|`.
 * - Each split view pane can contain it's own parameters and payloads
 * - Per split pane in each group, if not specified separately, the ID, params,
 *   and payload will be inherited from the first split pane in the pane group.
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
 *       // first split view
 *       {id: 'book-123'},
 *       // second split view
 *       {id: 'book-123', params: {view: 'preview'}},
 *     ],
 *   ],
 * ]
 * ```
 */
export type RouterPaneGroup = RouterSplitPane[]

/**
 * Represents a "pane item" or "split pane" in the router.
 *
 * - The desk tool stores the state of the current panes inside of the router.
 * - The panes are stored in groups delimited in the URL by `;`.
 * - In each group, there can be one or more split view panes delimited by `|`.
 * - Each split view pane can contain it's own parameters and payloads
 * - Per split pane in each group, if not specified separately, the ID, params,
 *   and payload will be inherited from the first split pane in the pane group.
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
 *       // first split view
 *       {id: 'book-123'},
 *       // second split view
 *       {id: 'book-123', params: {view: 'preview'}},
 *     ],
 *   ],
 * ]
 * ```
 */
export interface RouterSplitPane {
  id: string
  params?: Record<string, string | undefined>
  payload?: unknown
}

// TODO: unify this with the structure builder types
/**
 * Passed as the second argument to the item of resolving structure children
 */
export interface RouterSplitPaneContext {
  parent: unknown
  index: number
  splitIndex: number
  path: string[]
}

export interface StructureErrorType {
  helpId?: string
  message: string
  path?: Array<string | number>
  stack: string
}

export interface PreviewValue {
  id?: string
  subtitle?: React.ReactNode
  title?: React.ReactNode
  media?: React.ReactNode | React.ComponentType
  icon?: boolean
  type?: string
  displayOptions?: {showIcon?: boolean}
  schemaType?: {name?: string}
}

export type DeskToolPaneActionHandler = (params: any, scope?: unknown) => void
