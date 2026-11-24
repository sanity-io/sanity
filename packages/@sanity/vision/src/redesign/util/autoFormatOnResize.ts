/** How long the editor's size must stay put before a resize counts as done */
export const RESIZE_SETTLE_MS = 300

export interface ReformatForWidthOptions {
  query: string
  /** The editor's columns before the resize */
  previousWidth: number
  /** Formats a query to wrap at a width */
  format: (query: string, width: number) => Promise<string>
  /** Formats a query for the editor as it is now, as Prettify does */
  formatForEditor: (query: string) => Promise<string>
}

/**
 * Whether the formatter laid the query out for `previousWidth`, which is what lets a resize
 * reformat it. Empty queries, ones that do not parse and ones laid out by hand are not.
 */
async function isLaidOutForWidth(
  options: Pick<ReformatForWidthOptions, 'query' | 'previousWidth' | 'format'>,
): Promise<boolean> {
  const {query, previousWidth, format} = options
  if (!query.trim()) return false
  try {
    return (await format(query, previousWidth)) === query
  } catch {
    return false
  }
}

/**
 * The query laid out for the editor's new width, or `undefined` when it should be left as it
 * is: when it is empty or does not parse, when it was not laid out by the formatter for the old
 * width (formatted by hand, or edited since), or when the new width lays it out the same.
 */
export async function reformatForWidth(
  options: ReformatForWidthOptions,
): Promise<string | undefined> {
  const {query, previousWidth, format, formatForEditor} = options
  if (!(await isLaidOutForWidth({query, previousWidth, format}))) return undefined
  try {
    const formatted = await formatForEditor(query)
    return formatted === query ? undefined : formatted
  } catch {
    return undefined
  }
}

export interface AutoFormatOnResizeOptions extends Omit<
  ReformatForWidthOptions,
  'query' | 'previousWidth'
> {
  /** The editor's columns now; `undefined` while it has no layout */
  measure: () => number | undefined
  /** The query as it is now */
  getQuery: () => string
  isEnabled: () => boolean
  /**
   * Whether reformatting now would get in the way: the split is being dragged, an input method
   * composition is open, or the query was typed into just now. The settle waits it out.
   */
  isBusy: () => boolean
  /** Replaces the query with its reformatted version */
  apply: (formatted: string) => void
  /**
   * Called when {@link AutoFormatOnResize.pending} changes, so a view can follow it. Never called
   * after `dispose`.
   */
  onPendingChange?: (pending: boolean) => void
  settleMs?: number
}

export interface AutoFormatOnResize {
  /** The editor's size changed (or may have) */
  resized: () => void
  /** Records the editor's columns for `query`, the query it now holds, unless a resize is under way */
  sync: (query: string) => void
  /**
   * Whether the query is about to be reformatted, or may be: a resize of the editor is under way
   * or settling, or its reformat is in flight, and the setting is on and the query is one the
   * formatter laid out for the editor's width before. The query is out of step with the editor's
   * width for that time and is not worth formatting by hand: the reformat is about to do it.
   */
  readonly pending: boolean
  dispose: () => void
}

/**
 * Reformats the query once a resize of its editor settles, when the editor's columns changed and
 * the query was laid out by the formatter for the columns it had before (see
 * {@link reformatForWidth}). Resizes are only acted on once the size has stayed put for
 * `settleMs` and nothing is busy, so a drag reformats once, when it ends.
 */
export function createAutoFormatOnResize(options: AutoFormatOnResizeOptions): AutoFormatOnResize {
  const {
    measure,
    getQuery,
    isEnabled,
    isBusy,
    apply,
    onPendingChange,
    settleMs = RESIZE_SETTLE_MS,
  } = options
  // The editor's columns, and the query they were taken for: the line count moves the gutter
  let settledWidth = measure()
  let settledQuery = getQuery()
  let widthBeforeResize: number | undefined
  let queryBeforeResize: string | undefined
  let resizing = false
  let timer: ReturnType<typeof setTimeout> | undefined
  // Bumped by every resize, so a reformat started before one is dropped
  let generation = 0
  // Bumped by every resize that starts, a run of changes the settle has not dealt with yet
  let resizeId = 0
  let disposed = false
  let pending = false

  function setPending(next: boolean) {
    if (pending === next || disposed) return
    pending = next
    onPendingChange?.(next)
  }

  /** The resize has been dealt with, unless another one has started meanwhile */
  function finish() {
    if (!resizing) setPending(false)
  }

  /**
   * Pending from the first change of a resize on, for a query the formatter laid out for the
   * editor's width. Telling takes the formatter a moment, which Format's own recheck outlasts, so
   * a query that was not laid out that way never goes pending and Format stays on it.
   */
  async function beginPending(previousWidth: number | undefined, previousQuery: string) {
    if (previousWidth === undefined || !isEnabled()) return
    const started = resizeId
    const laidOut = await isLaidOutForWidth({...options, query: previousQuery, previousWidth})
    if (laidOut && resizing && started === resizeId) setPending(true)
  }

  function schedule() {
    clearTimeout(timer)
    timer = setTimeout(() => void settle(), settleMs)
  }

  async function settle() {
    timer = undefined
    if (isBusy()) {
      schedule()
      return
    }
    resizing = false
    const previousWidth = widthBeforeResize
    const previousQuery = queryBeforeResize
    const query = getQuery()
    const nextWidth = measure()
    widthBeforeResize = undefined
    queryBeforeResize = undefined
    settledWidth = nextWidth
    settledQuery = query
    if (previousWidth === undefined || nextWidth === undefined || previousWidth === nextWidth) {
      finish()
      return
    }
    // The columns before the resize are only known for the query the editor held then
    if (query !== previousQuery || !isEnabled()) {
      finish()
      return
    }
    const started = generation
    const formatted = await reformatForWidth({...options, query, previousWidth})
    // The formatter loads lazily: anything that changed meanwhile wins over the reformat
    if (
      formatted === undefined ||
      disposed ||
      started !== generation ||
      resizing ||
      getQuery() !== query ||
      !isEnabled() ||
      isBusy()
    ) {
      finish()
      return
    }
    apply(formatted)
    finish()
  }

  return {
    get pending() {
      return pending
    },
    resized() {
      if (disposed) return
      if (!resizing) {
        resizing = true
        resizeId++
        widthBeforeResize = settledWidth
        queryBeforeResize = settledQuery
        // A query typed into since the editor last settled was not laid out by the formatter
        if (getQuery() === settledQuery) void beginPending(settledWidth, settledQuery)
      }
      generation++
      schedule()
    },
    sync(query) {
      if (resizing || disposed) return
      settledWidth = measure()
      settledQuery = query
    },
    dispose() {
      disposed = true
      clearTimeout(timer)
    },
  }
}
