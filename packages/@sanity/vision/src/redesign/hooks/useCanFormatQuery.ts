import {useEffect, useRef, useState} from 'react'

/** How long a resize settles before Format is offered again */
export const FORMAT_RECHECK_MS = 200

/**
 * Whether formatting the query would change it. A query that does not parse cannot be formatted.
 * The formatter loads and runs asynchronously, so the answer for the previous query stands until
 * the one for the current query arrives, and an answer for a query edited meanwhile is dropped.
 * The formatter wraps to the editor's width, so a resize is checked again once it settles. A box
 * with no width (the editor hidden or not yet measured) is not one: that check would format for
 * the formatter's default width.
 *
 * `hold` is set while something else is about to lay the query out (auto-format on resize): no
 * Format then, whatever the answer is. The query that lands at the end of the hold is not given
 * the answer for the query it replaced, which would offer Format for a moment on a query that
 * has just been formatted.
 */
export function useCanFormatQuery(
  query: string,
  formatForEditor: (query: string) => Promise<string>,
  editorSize: {width: number; height: number} | null,
  hold = false,
): boolean {
  const [answer, setAnswer] = useState<{query: string | undefined; canFormat: boolean}>({
    query: undefined,
    canFormat: false,
  })
  const [wasHeld, setWasHeld] = useState(false)
  const seenQuery = useRef<string | undefined>(undefined)
  // Empty when the editor has no box yet, so a hidden editor is not formatted for a default width
  const layout =
    editorSize && editorSize.width > 0 ? `${editorSize.width}x${editorSize.height}` : ''

  useEffect(() => {
    const immediate = seenQuery.current !== query
    seenQuery.current = query
    if (!immediate && layout === '') return undefined
    let current = true
    const check = () => {
      formatForEditor(query).then(
        (formatted) => {
          if (current) setAnswer({query, canFormat: formatted !== query})
        },
        () => {
          if (current) setAnswer({query, canFormat: false})
        },
      )
    }
    if (immediate) {
      check()
      return () => {
        current = false
      }
    }
    const timer = setTimeout(check, FORMAT_RECHECK_MS)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [formatForEditor, layout, query])

  const answered = answer.query === query
  // Adjusted while rendering: an effect would leave a render in between, which shows the stale answer
  if (hold && !wasHeld) setWasHeld(true)
  else if (!hold && wasHeld && answered) setWasHeld(false)

  if (hold || (wasHeld && !answered)) return false
  return answer.canFormat
}
