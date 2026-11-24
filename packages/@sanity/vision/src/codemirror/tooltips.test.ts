import {EditorState} from '@codemirror/state'
import {EditorView, showTooltip} from '@codemirror/view'
import {afterAll, afterEach, beforeAll, describe, expect, onTestFinished, test, vi} from 'vitest'

import {visibleEditorRect, visionTooltips} from './tooltips'

let view: EditorView | undefined

afterEach(() => {
  view?.destroy()
  view = undefined
})

function rect(left: number, top: number, right: number, bottom: number): DOMRect {
  return DOMRect.fromRect({x: left, y: top, width: right - left, height: bottom - top})
}

describe('visibleEditorRect', () => {
  test('is the scroller cut down by the ancestors that clip it, inset from their edges', () => {
    // A pane under a toolbar, beside the result pane: the editor's document runs past both
    const pane = document.createElement('div')
    pane.style.overflow = 'hidden'
    document.body.append(pane)
    onTestFinished(() => pane.remove())
    view = new EditorView({
      state: EditorState.create({doc: '*[_type == "pokemons"]'}),
      parent: pane,
    })

    vi.spyOn(pane, 'getBoundingClientRect').mockReturnValue(rect(0, 40, 400, 600))
    vi.spyOn(view.scrollDOM, 'getBoundingClientRect').mockReturnValue(rect(0, 20, 900, 900))

    expect(visibleEditorRect(view)).toEqual({top: 44, left: 4, bottom: 596, right: 396})
  })

  test('ignores ancestors whose overflow is visible', () => {
    const wrapper = document.createElement('div')
    document.body.append(wrapper)
    onTestFinished(() => wrapper.remove())
    view = new EditorView({state: EditorState.create({doc: ''}), parent: wrapper})

    vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 10, 10))
    vi.spyOn(view.scrollDOM, 'getBoundingClientRect').mockReturnValue(rect(100, 100, 300, 300))

    expect(visibleEditorRect(view)).toEqual({top: 104, left: 104, bottom: 296, right: 296})
  })
})

describe('visionTooltips', () => {
  // jsdom has no text layout; CodeMirror measures the tooltip's anchor through a range
  beforeAll(() => {
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList
    Range.prototype.getBoundingClientRect = () => rect(0, 0, 0, 0)
  })
  afterAll(() => {
    // @ts-expect-error -- not implemented by jsdom, restored to that
    delete Range.prototype.getClientRects
    // @ts-expect-error -- not implemented by jsdom, restored to that
    delete Range.prototype.getBoundingClientRect
  })

  const tooltip = showTooltip.of({
    pos: 0,
    create: () => {
      const dom = document.createElement('div')
      dom.textContent = 'A finding'
      return {dom}
    },
  })

  test('renders tooltips outside the ancestor that would clip them, inside the cards around it', async () => {
    // The studio's card, then Vision's root: a size container, which clips fixed descendants
    const card = document.createElement('div')
    const root = document.createElement('div')
    root.style.transform = 'translateX(0px)'
    card.append(root)
    document.body.append(card)
    onTestFinished(() => card.remove())
    view = new EditorView({
      state: EditorState.create({doc: '*', extensions: [visionTooltips, tooltip]}),
      parent: root,
    })

    await vi.waitFor(() => {
      const rendered = card.querySelector(':scope > .cm-vision-tooltips .cm-tooltip')
      expect(rendered?.textContent).toBe('A finding')
    })
    expect(view.dom.querySelector('.cm-tooltip')).toBeNull()

    view.destroy()
    view = undefined
    expect(card.querySelector('.cm-vision-tooltips')).toBeNull()
  })

  test('keeps tooltips in the editor when nothing around it clips them', async () => {
    view = new EditorView({
      state: EditorState.create({doc: '*', extensions: [visionTooltips, tooltip]}),
      parent: document.body,
    })
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(view.dom.querySelector('.cm-tooltip')?.textContent).toBe('A finding')
    expect(document.querySelector('.cm-vision-tooltips')).toBeNull()
  })
})
