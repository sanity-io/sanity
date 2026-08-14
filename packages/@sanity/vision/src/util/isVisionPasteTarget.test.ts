import {describe, expect, it} from 'vitest'

import {isVisionPasteTarget} from './isVisionPasteTarget'

/**
 * Dispatches a paste event the way the browser does, then reports what the `document` level
 * listener Vision installs would decide about it.
 */
function decide(root: Node | null, target: EventTarget): boolean | undefined {
  const decisions: boolean[] = []
  const listener = (event: Event) =>
    decisions.push(isVisionPasteTarget(root, event as ClipboardEvent))

  document.addEventListener('paste', listener)
  target.dispatchEvent(new Event('paste', {bubbles: true, composed: true}))
  document.removeEventListener('paste', listener)

  return decisions.at(0)
}

/** Renders `html`, where `#root` stands in for the Vision tool and `#target` receives the paste. */
function pasteInto(html: string): boolean | undefined {
  document.body.innerHTML = html

  return decide(document.getElementById('root'), document.getElementById('target')!)
}

describe('isVisionPasteTarget', () => {
  it('accepts the query editor, a contenteditable inside vision', () => {
    expect(pasteInto('<div id="root"><div id="target" contenteditable></div></div>')).toBe(true)
  })

  it('accepts a paste with nothing focused, which targets the body', () => {
    document.body.innerHTML = '<div id="root"></div>'

    expect(decide(document.getElementById('root'), document.body)).toBe(true)
  })

  it('accepts a target the editor detached while handling the paste itself', () => {
    document.body.innerHTML = '<div id="root"><div id="editor"><br id="target"></div></div>'
    const editor = document.getElementById('editor')!
    const line = document.getElementById('target')!
    editor.addEventListener('paste', () => line.remove())

    expect(decide(document.getElementById('root'), line)).toBe(true)
  })

  it.each([
    [
      'the studio search field, rendered outside vision',
      '<div id="root"></div><input id="target">',
    ],
    ['a text input inside vision', '<div id="root"><input id="target"></div>'],
    ['a textarea', '<div id="root"><textarea id="target"></textarea></div>'],
    ['an element outside vision', '<div id="root"></div><div id="target"></div>'],
    ['anything at all before vision has mounted', '<div id="target"></div>'],
  ])('rejects %s', (_, html) => {
    expect(pasteInto(html)).toBe(false)
  })
})
