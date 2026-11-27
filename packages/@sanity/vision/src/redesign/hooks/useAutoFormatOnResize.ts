import {type RefObject, useEffect, useEffectEvent, useRef, useState} from 'react'

import {type VisionCodeMirrorHandle} from '../../codemirror/VisionCodeMirror'
import {type AutoFormatOnResize, createAutoFormatOnResize} from '../util/autoFormatOnResize'
import {formatGroq} from '../util/groqWasm'

/**
 * A divider being dragged that resizes the query editor: the request/response split changes its
 * width, and the request column's bottom panel and the params change its height, which can show or
 * hide the scrollbar and so its columns. Panning the result graph sets `data-dragging` too, and
 * that drag does not resize the editor.
 */
const RESIZING_EDITOR = [
  'vision-split-handle',
  'vision-request-column-split-handle',
  'vision-query-params-split-handle',
]
  .map((testId) => `[data-testid="${testId}"][data-dragging="true"]`)
  .join(', ')

export interface UseAutoFormatOnResizeOptions {
  /** The query tab's panel, holding the split and the query editor */
  container: HTMLElement | null
  /** Which layout the tab renders: the split remounts the editor when it changes */
  layout: string
  editorRef: RefObject<VisionCodeMirrorHandle | null>
  enabled: boolean
  query: string
  /** The query as the tab holds it right now, which may be ahead of the last render */
  getQuery: () => string
  /** Formats a query for the editor's current width, as Prettify does */
  formatForEditor: (query: string) => Promise<string>
  /** Records the reformatted query on the tab, once the editor shows it */
  onFormatted: (formatted: string) => void
}

/**
 * Reformats a query the formatter laid out for the query editor's width when that width
 * changes: a drag of a divider or a resize of the window. Waits for the resize to settle and
 * leaves the query alone while a divider that resizes the editor is being dragged, or the query
 * is being typed in.
 *
 * Returns whether the query is about to be reformatted, or may be (see
 * {@link AutoFormatOnResize.pending}): a resize is under way or settling, or its reformat is
 * in flight. Format is not offered then, since the reformat is about to do it.
 */
export function useAutoFormatOnResize(options: UseAutoFormatOnResizeOptions): boolean {
  const {container, layout, editorRef, enabled, query, getQuery, formatForEditor, onFormatted} =
    options
  const isEnabled = useEffectEvent(() => enabled)
  const readQuery = useEffectEvent(() => getQuery())
  const formatForEditorEvent = useEffectEvent((text: string) => formatForEditor(text))
  const apply = useEffectEvent((formatted: string) => {
    editorRef.current?.reformat(formatted)
    onFormatted(formatted)
  })
  const controllerRef = useRef<AutoFormatOnResize | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const editorElement = container?.querySelector('[data-testid="vision-query-editor"]')
    if (!container || !editorElement || typeof ResizeObserver === 'undefined') return undefined
    const controller = createAutoFormatOnResize({
      measure: () => editorRef.current?.getVisibleColumns(),
      getQuery: readQuery,
      isEnabled,
      isBusy: () =>
        container.querySelector(RESIZING_EDITOR) !== null ||
        editorRef.current?.isEditing() === true,
      format: formatGroq,
      formatForEditor: formatForEditorEvent,
      apply,
      onPendingChange: setPending,
    })
    const observer = new ResizeObserver(() => controller.resized())
    observer.observe(editorElement)
    controllerRef.current = controller
    return () => {
      observer.disconnect()
      controller.dispose()
      controllerRef.current = null
      setPending(false)
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- the split remounts the editor element when the layout changes, so it is looked up and observed again
  }, [container, editorRef, layout])

  // The line count moves the line-number gutter and the scrollbar, so the editor's columns are
  // taken again for every query
  useEffect(() => {
    controllerRef.current?.sync(query)
  }, [query])

  return enabled && pending
}
