import {afterEach, describe, expect, it} from 'vitest'

import {isVisionPasteTarget} from './isVisionPasteTarget'

function renderVisionRoot(): HTMLElement {
  const root = document.createElement('div')
  document.body.appendChild(root)
  return root
}

function appendTo(parent: HTMLElement, tagName: string): HTMLElement {
  const element = document.createElement(tagName)
  parent.appendChild(element)
  return element
}

/**
 * Dispatches a paste event the way the browser does, then reports what the `document` level
 * listener that Vision installs would decide about it.
 */
function pasteOn(root: Node | null, target: EventTarget): boolean {
  let allowed = false
  const listener = (event: Event) => {
    allowed = isVisionPasteTarget(root, event as ClipboardEvent)
  }

  document.addEventListener('paste', listener)
  target.dispatchEvent(new Event('paste', {bubbles: true, composed: true}))
  document.removeEventListener('paste', listener)

  return allowed
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('isVisionPasteTarget', () => {
  it('accepts the body when nothing is focused', () => {
    expect(pasteOn(renderVisionRoot(), document.body)).toBe(true)
  })

  it('accepts the vision root itself', () => {
    const root = renderVisionRoot()
    expect(pasteOn(root, root)).toBe(true)
  })

  it('accepts the query editor, which is a contenteditable inside the vision root', () => {
    const root = renderVisionRoot()
    const editor = appendTo(root, 'div')
    editor.contentEditable = 'true'

    expect(pasteOn(root, editor)).toBe(true)
  })

  it('accepts a target the editor detached while handling the paste itself', () => {
    const root = renderVisionRoot()
    const editor = appendTo(root, 'div')
    const line = appendTo(editor, 'br')

    // CodeMirror handles the paste on its own element and re-renders the affected line before the
    // event reaches `document`, leaving the original target outside the document
    editor.addEventListener('paste', () => line.remove())

    expect(pasteOn(root, line)).toBe(true)
  })

  it('rejects an input rendered outside the vision root, such as the studio search field', () => {
    const root = renderVisionRoot()

    expect(pasteOn(root, appendTo(document.body, 'input'))).toBe(false)
  })

  it('rejects an input rendered inside the vision root', () => {
    const root = renderVisionRoot()

    expect(pasteOn(root, appendTo(root, 'input'))).toBe(false)
  })

  it('rejects a textarea', () => {
    const root = renderVisionRoot()

    expect(pasteOn(root, appendTo(document.body, 'textarea'))).toBe(false)
  })

  it('rejects an element outside the vision root', () => {
    const root = renderVisionRoot()

    expect(pasteOn(root, appendTo(document.body, 'div'))).toBe(false)
  })

  it('rejects an element when the vision root has not mounted', () => {
    expect(pasteOn(null, appendTo(document.body, 'div'))).toBe(false)
  })
})
