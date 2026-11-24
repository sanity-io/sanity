import {EditorState} from '@codemirror/state'
import {EditorView} from '@codemirror/view'
import {afterEach, describe, expect, it} from 'vitest'

import {queryEndSlot, queryEndSlotElement} from './queryEndSlot'

const views: EditorView[] = []

function createView(doc: string, slot?: HTMLElement) {
  const parent = document.createElement('div')
  document.body.append(parent)
  const view = new EditorView({
    parent,
    state: EditorState.create({doc, extensions: slot ? [queryEndSlot(slot)] : []}),
  })
  views.push(view)
  return view
}

afterEach(() => {
  for (const view of views.splice(0)) {
    view.dom.parentElement?.remove()
    view.destroy()
  }
})

describe('queryEndSlot', () => {
  it('shows the slot right after the last line, in the scrolling content', () => {
    const slot = document.createElement('div')
    const view = createView('*[_type == "author"]\n{name}', slot)

    expect(view.contentDOM.contains(slot)).toBe(true)
    const lines = view.contentDOM.querySelectorAll('.cm-line')
    expect(lines).toHaveLength(2)
    expect(lines[1].nextElementSibling).toBe(slot)
  })

  it('follows the query as lines are added and removed', () => {
    const slot = document.createElement('div')
    const view = createView('*', slot)

    view.dispatch({changes: {from: 1, insert: '\n[0]\n{_id}'}})
    expect(view.contentDOM.querySelectorAll('.cm-line')[2].nextElementSibling).toBe(slot)

    view.dispatch({changes: {from: 0, to: view.state.doc.length}})
    expect(view.contentDOM.querySelectorAll('.cm-line')[0].nextElementSibling).toBe(slot)
  })

  it('leaves events in the slot to its own controls', () => {
    const slot = document.createElement('div')
    const view = createView('*', slot)
    const input = document.createElement('input')
    slot.append(input)

    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'a', bubbles: true}))
    input.value = 'authors'
    expect(view.state.doc.toString()).toBe('*')
  })

  it('names its slot to the state, and nothing without it', () => {
    const slot = document.createElement('div')
    expect(EditorState.create({extensions: [queryEndSlot(slot)]}).facet(queryEndSlotElement)).toBe(
      slot,
    )
    expect(EditorState.create().facet(queryEndSlotElement)).toBeNull()
  })
})
