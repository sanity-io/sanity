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
 * The query laid out for the editor's new width, or `undefined` when it should be left as it
 * is: when it is empty or does not parse, when it was not laid out by the formatter for the old
 * width (formatted by hand, or edited since), or when the new width lays it out the same.
 */
export async function reformatForWidth(
  options: ReformatForWidthOptions,
): Promise<string | undefined> {
  const {query, previousWidth, format, formatForEditor} = options
  if (!query.trim()) return undefined
  try {
    if ((await format(query, previousWidth)) !== query) return undefined
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
  settleMs?: number
}

export interface AutoFormatOnResize {
  /** The editor's size changed (or may have) */
  resized: () => void
  /** Records the editor's columns for `query`, the query it now holds, unless a resize is under way */
  sync: (query: string) => void
  dispose: () => void
}

/**
 * Reformats the query once a resize of its editor settles, when the editor's columns changed and
 * the query was laid out by the formatter for the columns it had before (see
 * {@link reformatForWidth}). Resizes are only acted on once the size has stayed put for
 * `settleMs` and nothing is busy, so a drag reformats once, when it ends.
 */
export function createAutoFormatOnResize(options: AutoFormatOnResizeOptions): AutoFormatOnResize {
  const {measure, getQuery, isEnabled, isBusy, apply, settleMs = RESIZE_SETTLE_MS} = options
  // The editor's columns, and the query they were taken for: the line count moves the gutter
  let settledWidth = measure()
  let settledQuery = getQuery()
  let widthBeforeResize: number | undefined
  let queryBeforeResize: string | undefined
  let resizing = false
  let timer: ReturnType<typeof setTimeout> | undefined
  // Bumped by every resize, so a reformat started before one is dropped
  let generation = 0
  let disposed = false

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
      return
    }
    // The columns before the resize are only known for the query the editor held then
    if (query !== previousQuery || !isEnabled()) return
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
      return
    }
    apply(formatted)
  }

  return {
    resized() {
      if (disposed) return
      if (!resizing) {
        resizing = true
        widthBeforeResize = settledWidth
        queryBeforeResize = settledQuery
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
