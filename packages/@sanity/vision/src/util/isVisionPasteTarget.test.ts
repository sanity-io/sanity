import {describe, expect, it} from 'vitest'

import {isVisionPasteTarget} from './isVisionPasteTarget'

// `composedPath()` is only populated while an event is being dispatched.
function pasteOn(target: Node, visionRoot: Node): boolean {
  const decisions: boolean[] = []

  document.addEventListener(
    'paste',
    (event) => decisions.push(isVisionPasteTarget(visionRoot, event as ClipboardEvent)),
    {once: true},
  )
  target.dispatchEvent(new Event('paste', {bubbles: true, composed: true}))

  return decisions[0]
}

function renderVision(): HTMLElement {
  return document.body.appendChild(document.createElement('div'))
}

describe('isVisionPasteTarget', () => {
  it('leaves the studio search field alone', () => {
    const vision = renderVision()
    const searchField = document.body.appendChild(document.createElement('input'))

    expect(pasteOn(searchField, vision)).toBe(false)
  })

  it('leaves an element elsewhere in the studio alone', () => {
    const vision = renderVision()
    const dialog = document.body.appendChild(document.createElement('div'))

    expect(pasteOn(dialog, vision)).toBe(false)
  })

  it('leaves vision own text inputs alone', () => {
    const vision = renderVision()
    const apiVersionField = vision.appendChild(document.createElement('input'))

    expect(pasteOn(apiVersionField, vision)).toBe(false)
  })

  it('claims a paste into the query editor', () => {
    const vision = renderVision()
    const editor = vision.appendChild(document.createElement('div'))

    expect(pasteOn(editor, vision)).toBe(true)
  })

  it('claims a paste even though the editor detached the target while handling it', () => {
    const vision = renderVision()
    const editor = vision.appendChild(document.createElement('div'))
    const line = editor.appendChild(document.createElement('br'))
    editor.addEventListener('paste', () => line.remove())

    expect(pasteOn(line, vision)).toBe(true)
  })

  it('claims a paste with nothing focused', () => {
    expect(pasteOn(document.body, renderVision())).toBe(true)
  })
})
