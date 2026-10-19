import {type EditorView} from '@codemirror/view'

/** What the measurement needs from an editor view */
export type MeasurableEditorView = Pick<
  EditorView,
  'scrollDOM' | 'contentDOM' | 'defaultCharacterWidth' | 'defaultLineHeight'
> & {state: {doc: {lines: number}}}

export interface VisibleColumnsOptions {
  /**
   * The number of lines the document is about to have (formatting changes it). The
   * line-number gutter grows with the digits of that count, and a document taller than the
   * editor gets a vertical scrollbar; both take columns from the text.
   */
  lines?: number
  /** The width a classic (non-overlay) vertical scrollbar takes; measured from the page by default */
  scrollbarWidth?: number
}

function insets(element: Element, sides: readonly ('Left' | 'Right' | 'Top' | 'Bottom')[]): number {
  const style = getComputedStyle(element)
  let total = 0
  for (const side of sides) {
    total +=
      (parseFloat(style[`padding${side}`]) || 0) + (parseFloat(style[`border${side}Width`]) || 0)
  }
  return total
}

/** How many digits CodeMirror's line-number gutter reserves for a document of `lines` lines: 9, 99, 999, ... */
export function lineNumberDigits(lines: number): number {
  let widest = 9
  while (widest < lines) widest = widest * 10 + 9
  return String(widest).length
}

let measuredScrollbarWidth: number | undefined

/** The width of a classic vertical scrollbar; 0 where scrollbars are overlaid (macOS, phones) */
function getScrollbarWidth(): number {
  if (measuredScrollbarWidth === undefined) {
    const probe = document.createElement('div')
    probe.style.cssText =
      'position:absolute;top:-9999px;left:-9999px;width:100px;height:100px;overflow:scroll;visibility:hidden'
    document.body.append(probe)
    measuredScrollbarWidth = Math.max(0, probe.offsetWidth - probe.clientWidth)
    probe.remove()
  }
  return measuredScrollbarWidth
}

/**
 * How many default-width characters fit on a line of the editor without scrolling sideways: the
 * scroller's visible width less its gutters and the insets around the text (the content's
 * padding and borders, and the line's padding). With `lines`, the width is the one the editor
 * will have once the document has that many lines: a wider line-number gutter, and a vertical
 * scrollbar where the document will no longer fit the editor's height. `undefined` while the
 * editor has no layout, as when it is hidden or has not measured its font yet.
 */
export function getVisibleColumns(
  view: MeasurableEditorView,
  {lines, scrollbarWidth}: VisibleColumnsOptions = {},
): number | undefined {
  const {scrollDOM, contentDOM, defaultCharacterWidth, defaultLineHeight} = view
  const gutters = scrollDOM.querySelector('.cm-gutters')
  const line = contentDOM.querySelector('.cm-line')
  const currentLines = view.state.doc.lines
  const nextLines = lines ?? currentLines

  const gutterGrowth =
    (lineNumberDigits(nextLines) - lineNumberDigits(currentLines)) * defaultCharacterWidth
  const willOverflowVertically =
    nextLines * defaultLineHeight + insets(contentDOM, ['Top', 'Bottom']) > scrollDOM.clientHeight
  const hasVerticalScrollbar = scrollDOM.scrollHeight > scrollDOM.clientHeight
  const scrollbarReserve =
    willOverflowVertically && !hasVerticalScrollbar ? (scrollbarWidth ?? getScrollbarWidth()) : 0

  const width =
    scrollDOM.clientWidth -
    (gutters instanceof HTMLElement ? gutters.offsetWidth : 0) -
    gutterGrowth -
    insets(contentDOM, ['Left', 'Right']) -
    (line ? insets(line, ['Left', 'Right']) : 0) -
    scrollbarReserve
  const columns = Math.floor(width / defaultCharacterWidth)
  return Number.isFinite(columns) && columns > 0 ? columns : undefined
}
