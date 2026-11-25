import {Compartment, type Extension} from '@codemirror/state'
import {EditorView, type Rect, tooltips, ViewPlugin} from '@codemirror/view'

const MAX_WIDTH_PROPERTY = '--vision-tooltip-max-width'

/** Margin kept between a tooltip and the edges of the area it is placed in */
const EDGE = 4

/**
 * Below this many lines of visible editor, a tooltip cannot fit on either side of its line, so it
 * is placed against the window instead
 */
const MIN_LINES = 4

function clipsOverflow(style: CSSStyleDeclaration): boolean {
  return style.overflowX !== 'visible' || style.overflowY !== 'visible'
}

/** Whether `fixed` descendants are positioned, and clipped, against this element, not the window */
function containsFixed(style: CSSStyleDeclaration): boolean {
  const set = (value: string | undefined, initial: string) =>
    value !== undefined && value !== '' && value !== initial
  return (
    set(style.transform, 'none') ||
    set(style.perspective, 'none') ||
    set(style.filter, 'none') ||
    set(style.backdropFilter, 'none') ||
    set(style.containerType, 'normal') ||
    /paint|layout|strict|content/.test(style.contain ?? '') ||
    /transform|perspective|filter/.test(style.willChange ?? '')
  )
}

/**
 * The part of the editor the user can see: its scroller, cut down by every ancestor that clips
 * its overflow (the pane under its toolbar, a scrolling panel) and by the window, inset a little
 */
export function visibleEditorRect(view: EditorView): Rect {
  const win = view.dom.ownerDocument.defaultView
  let {top, left, bottom, right} = view.scrollDOM.getBoundingClientRect()
  if (win) {
    top = Math.max(top, 0)
    left = Math.max(left, 0)
    bottom = Math.min(bottom, win.innerHeight)
    right = Math.min(right, win.innerWidth)
  }
  for (
    let element = view.scrollDOM.parentElement;
    element && element !== view.dom.ownerDocument.body;
    element = element.parentElement
  ) {
    if (!clipsOverflow(getComputedStyle(element))) continue
    const rect = element.getBoundingClientRect()
    top = Math.max(top, rect.top)
    left = Math.max(left, rect.left)
    bottom = Math.min(bottom, rect.bottom)
    right = Math.min(right, rect.right)
  }
  return {
    top: top + EDGE,
    left: left + EDGE,
    bottom: Math.max(top + EDGE, bottom - EDGE),
    right: Math.max(left + EDGE, right - EDGE),
  }
}

/**
 * The outermost ancestor of the editor that `fixed` tooltips cannot escape, or `null` when they
 * already overlay the page from where they are
 */
function fixedContainer(view: EditorView): HTMLElement | null {
  let container: HTMLElement | null = null
  for (
    let element = view.dom.parentElement;
    element && element !== view.dom.ownerDocument.body;
    element = element.parentElement
  ) {
    if (containsFixed(getComputedStyle(element))) container = element
  }
  return container
}

const placement = new Compartment()

function tooltipConfig(parent?: HTMLElement): Extension {
  return tooltips({position: 'fixed', parent, tooltipSpace})
}

/**
 * Renders the editor's tooltips just outside the outermost ancestor that would clip them (Vision's
 * root is a size container, which positions and clips `fixed` descendants), so they overlay the
 * page. They stay inside the cards around it, so the theme's card variables still reach them.
 */
const tooltipPortal = ViewPlugin.fromClass(
  class {
    /** Tooltips that did not fit on either side of their line within the visible editor */
    readonly overflowing = new WeakSet<HTMLElement>()
    readonly host: HTMLElement
    destroyed = false

    constructor(readonly view: EditorView) {
      this.host = view.dom.ownerDocument.createElement('div')
      this.host.className = 'cm-vision-tooltips'
      // Out of the layout of the element it is added to; fixed tooltips in it place themselves.
      // Not fixed itself, which would make it a stacking context below Vision's raised handles
      Object.assign(this.host.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '0',
        height: '0',
      })
      view.requestMeasure({
        key: this,
        read: (current) => {
          const {fontFamily, fontSize, lineHeight} = getComputedStyle(current.dom)
          return {container: fixedContainer(current), font: {fontFamily, fontSize, lineHeight}}
        },
        write: ({container, font}) => {
          const parent = container?.parentElement
          if (!parent) return
          // Set in the editor, so the tooltips' text matches it out there too
          Object.assign(this.host.style, font)
          parent.append(this.host)
          // Not while measuring: a reconfiguration is a transaction
          setTimeout(() => {
            if (this.destroyed) return
            view.dispatch({effects: placement.reconfigure(tooltipConfig(this.host))})
          })
        },
      })
    }

    tooltips(): HTMLElement[] {
      const owner = this.host.isConnected ? this.host : this.view.dom
      return [
        ...owner.querySelectorAll<HTMLElement>(':scope > .cm-tooltip, :scope > * > .cm-tooltip'),
      ]
    }

    space(): Rect {
      const editor = visibleEditorRect(this.view)
      const width = Math.max(0, editor.right - editor.left)
      this.host.style.setProperty(MAX_WIDTH_PROPERTY, `${width}px`)
      this.view.dom.style.setProperty(MAX_WIDTH_PROPERTY, `${width}px`)

      // CodeMirror shrinks a tooltip that fits on neither side to the larger one. Such a tooltip,
      // and any in an editor too short to hold one, goes over the panes above and below instead.
      const live = this.tooltips()
      for (const dom of live) if (dom.style.height !== '') this.overflowing.add(dom)
      const short = editor.bottom - editor.top < this.view.defaultLineHeight * MIN_LINES
      if (!short && !live.some((dom) => this.overflowing.has(dom))) return editor

      const win = this.view.dom.ownerDocument.defaultView
      return {...editor, top: EDGE, bottom: Math.max(EDGE, (win?.innerHeight ?? 0) - EDGE)}
    }

    destroy() {
      this.destroyed = true
      this.host.remove()
    }
  },
)

function tooltipSpace(view: EditorView): Rect {
  return view.plugin(tooltipPortal)?.space() ?? visibleEditorRect(view)
}

/**
 * Every Vision editor's tooltips (lint findings, function docs, completions and their info):
 * placed within the part of the editor the user can see, opening below their line when the space
 * above cannot fit them and never reaching past the editor's sides into the pane beside it. One
 * that fits on neither side overlays the panes above and below rather than being cut off.
 */
export const visionTooltips: Extension = [
  placement.of(tooltipConfig()),
  tooltipPortal,
  EditorView.theme({
    '& .cm-tooltip': {
      boxSizing: 'border-box',
      maxWidth: `var(${MAX_WIDTH_PROPERTY}, none)`,
    },
  }),
]
