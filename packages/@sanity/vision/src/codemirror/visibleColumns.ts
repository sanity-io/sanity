import {type EditorView} from '@codemirror/view'

/** What the measurement needs from an editor view */
export type MeasurableEditorView = Pick<
  EditorView,
  'scrollDOM' | 'contentDOM' | 'defaultCharacterWidth'
>

/** The horizontal padding and borders of an element, in pixels */
function horizontalInsets(element: Element): number {
  const style = getComputedStyle(element)
  return (
    (parseFloat(style.paddingLeft) || 0) +
    (parseFloat(style.paddingRight) || 0) +
    (parseFloat(style.borderLeftWidth) || 0) +
    (parseFloat(style.borderRightWidth) || 0)
  )
}

/**
 * How many default-width characters fit on a line of the editor without scrolling sideways: the
 * scroller's visible width less its gutters and the insets around the text (the content's
 * padding and borders, and the line's padding). `undefined` while the editor has no layout, as
 * when it is hidden or has not measured its font yet.
 */
export function getVisibleColumns(view: MeasurableEditorView): number | undefined {
  const {scrollDOM, contentDOM, defaultCharacterWidth} = view
  const gutters = scrollDOM.querySelector('.cm-gutters')
  const line = contentDOM.querySelector('.cm-line')
  const width =
    scrollDOM.clientWidth -
    (gutters instanceof HTMLElement ? gutters.offsetWidth : 0) -
    horizontalInsets(contentDOM) -
    (line ? horizontalInsets(line) : 0)
  const columns = Math.floor(width / defaultCharacterWidth)
  return Number.isFinite(columns) && columns > 0 ? columns : undefined
}
