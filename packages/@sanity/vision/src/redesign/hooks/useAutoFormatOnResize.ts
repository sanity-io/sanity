import {type RefObject, useEffect, useEffectEvent, useRef} from 'react'

import {type VisionCodeMirrorHandle} from '../../codemirror/VisionCodeMirror'
import {type AutoFormatOnResize, createAutoFormatOnResize} from '../util/autoFormatOnResize'
import {formatGroq} from '../util/groqWasm'

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
 * changes: a drag of the split or a resize of the window. Waits for the resize to settle and
 * leaves the query alone while the split is being dragged or the query is being typed in.
 */
export function useAutoFormatOnResize(options: UseAutoFormatOnResizeOptions): void {
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

  useEffect(() => {
    const editorElement = container?.querySelector('[data-testid="vision-query-editor"]')
    if (!container || !editorElement || typeof ResizeObserver === 'undefined') return undefined
    const controller = createAutoFormatOnResize({
      measure: () => editorRef.current?.getVisibleColumns(),
      getQuery: readQuery,
      isEnabled,
      isBusy: () =>
        container.querySelector('[data-dragging="true"]') !== null ||
        editorRef.current?.isEditing() === true,
      format: formatGroq,
      formatForEditor: formatForEditorEvent,
      apply,
    })
    const observer = new ResizeObserver(() => controller.resized())
    observer.observe(editorElement)
    controllerRef.current = controller
    return () => {
      observer.disconnect()
      controller.dispose()
      controllerRef.current = null
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- the split remounts the editor element when the layout changes, so it is looked up and observed again
  }, [container, editorRef, layout])

  // The line count moves the line-number gutter and the scrollbar, so the editor's columns are
  // taken again for every query
  useEffect(() => {
    controllerRef.current?.sync(query)
  }, [query])
}
