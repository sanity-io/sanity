import {describe, expect, it} from 'vitest'

import {isVisionPasteTarget} from './isVisionPasteTarget'

// `composedPath()` is only populated while an event is being dispatched, so the decision has to be
// taken from a real listener rather than a hand-made event object.
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
  it('leaves a text field elsewhere in the studio alone', () => {
    const vision = renderVision()
    const searchField = document.body.appendChild(document.createElement('input'))

    expect(pasteOn(searchField, vision)).toBe(false)
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
})
