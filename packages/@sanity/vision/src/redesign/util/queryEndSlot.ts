import {type EditorState, type Extension, Facet, StateField} from '@codemirror/state'
import {Decoration, type DecorationSet, EditorView, ViewPlugin, WidgetType} from '@codemirror/view'

/** Height of the slot before it has been measured: one button row */
const ESTIMATED_HEIGHT = 41

/** The slot an editor shows under its last line, if any */
export const queryEndSlotElement = Facet.define<HTMLElement, HTMLElement | null>({
  combine: (slots) => slots[0] ?? null,
})

class QueryEndWidget extends WidgetType {
  constructor(readonly slot: HTMLElement) {
    super()
  }

  override eq(other: QueryEndWidget): boolean {
    return other.slot === this.slot
  }

  override toDOM(): HTMLElement {
    return this.slot
  }

  override get estimatedHeight(): number {
    return this.slot.offsetHeight || ESTIMATED_HEIGHT
  }

  // The slot holds its own controls: clicks and keys stay with them, not with the editor
  override ignoreEvent(): boolean {
    return true
  }
}

/**
 * Shows `slot` under the last line of the document, inside the editor's scrolling content, so it
 * follows the query down and scrolls with it. The slot is as wide as the visible content and
 * sticks where the content starts, right of the gutters, so a query scrolled sideways keeps it in view; whatever
 * renders into the slot (a React portal) changes its height, which the editor then measures again.
 */
export function queryEndSlot(slot: HTMLElement): Extension {
  const widget = Decoration.widget({widget: new QueryEndWidget(slot), block: true, side: 1})
  const atEnd = (state: EditorState) => Decoration.set(widget.range(state.doc.length))
  // Block widgets have to come from the state, not from a function of the view
  const decorations = StateField.define<DecorationSet>({
    create: atEnd,
    update: (value, transaction) => (transaction.docChanged ? atEnd(transaction.state) : value),
    provide: (field) => EditorView.decorations.from(field),
  })
  const fit = ViewPlugin.define((view) => {
    const measure = () =>
      view.requestMeasure({
        key: slot,
        // Where the content starts in the scroller (past the gutters and the space after them), and
        // its right border, which a sticky slot can't overlap when the query is scrolled to its end
        read: () => {
          const scroller = view.scrollDOM
          const content = view.contentDOM
          const offset =
            content.getBoundingClientRect().left -
            scroller.getBoundingClientRect().left -
            scroller.clientLeft +
            scroller.scrollLeft
          const border = parseFloat(getComputedStyle(content).borderRightWidth) || 0
          return {width: scroller.clientWidth - border, offset: Math.max(0, offset)}
        },
        write: ({width, offset}) => {
          slot.style.left = `${offset}px`
          slot.style.width = `${Math.max(0, width - offset)}px`
        },
      })
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(view.scrollDOM)
    observer?.observe(slot)
    measure()
    return {
      // A longer document can widen the line-number gutter without resizing the scroller
      update: (update) => {
        if (update.geometryChanged) measure()
      },
      destroy: () => observer?.disconnect(),
    }
  })
  return [queryEndSlotElement.of(slot), decorations, fit]
}
