import {afterEach, describe, expect, it, vi} from 'vitest'

import {stripStegaFromPasteEvent} from './stegaPaste'

/**
 * Appends a fake stega sequence to the given text. `@vercel/stega` encodes metadata as sequences
 * of invisible characters (zero-width space/non-joiner/joiner and BOM), starting with a marker of
 * four zero-width spaces.
 */
function stega(text: string): string {
  return `${text}\u200b\u200b\u200b\u200b${'\u200c\u200d\ufeff\u200b'.repeat(4)}`
}

function createPasteEvent(target: Element, text: string) {
  return {
    currentTarget: target,
    clipboardData: {getData: (type: string) => (type === 'text/plain' ? text : '')},
    preventDefault: vi.fn(),
  } as unknown as React.ClipboardEvent & {preventDefault: ReturnType<typeof vi.fn>}
}

function createInput(props: {type?: string; value?: string} = {}): HTMLInputElement {
  const input = document.createElement('input')
  input.type = props.type ?? 'text'
  if (props.value) input.value = props.value
  document.body.appendChild(input)
  return input
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('stripStegaFromPasteEvent', () => {
  it('does nothing when the pasted text contains no stega characters', () => {
    const input = createInput()
    const event = createPasteEvent(input, 'plain text')

    stripStegaFromPasteEvent(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(input.value).toBe('')
  })

  it('does nothing when the clipboard contains no text', () => {
    const input = createInput()
    const event = createPasteEvent(input, '')

    stripStegaFromPasteEvent(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('replaces the paste with cleaned text when stega characters are present', () => {
    const input = createInput()
    input.focus()
    const event = createPasteEvent(input, stega('Hello world'))
    const inputEvents = vi.fn()
    input.addEventListener('input', inputEvents)

    stripStegaFromPasteEvent(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(input.value).toBe('Hello world')
    expect(inputEvents).toHaveBeenCalledTimes(1)
  })

  it('inserts the cleaned text at the current selection', () => {
    const input = createInput({value: 'before/after'})
    input.focus()
    input.setSelectionRange(7, 7)
    const event = createPasteEvent(input, stega('pasted/'))

    stripStegaFromPasteEvent(event)

    expect(input.value).toBe('before/pasted/after')
    expect(input.selectionStart).toBe(14)
    expect(input.selectionEnd).toBe(14)
  })

  it('replaces the selected text with the cleaned text', () => {
    const input = createInput({value: 'replace THIS please'})
    input.focus()
    input.setSelectionRange(8, 12)
    const event = createPasteEvent(input, stega('THAT'))

    stripStegaFromPasteEvent(event)

    expect(input.value).toBe('replace THAT please')
  })

  it('works with textareas, preserving line breaks in the pasted text', () => {
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.focus()
    const event = createPasteEvent(textarea, stega('line one\nline two'))

    stripStegaFromPasteEvent(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(textarea.value).toBe('line one\nline two')
  })

  it('replaces the entire value of inputs without text selection support (e.g. number)', () => {
    const input = createInput({type: 'number', value: '1'})
    input.focus()
    const event = createPasteEvent(input, stega('42'))

    stripStegaFromPasteEvent(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(input.value).toBe('42')
  })

  it('uses execCommand when available, preserving the browser undo stack', () => {
    const input = createInput()
    input.focus()
    const execCommand = vi.fn().mockReturnValue(true)
    ;(document as {execCommand?: typeof execCommand}).execCommand = execCommand
    try {
      const event = createPasteEvent(input, stega('Hello'))

      stripStegaFromPasteEvent(event)

      expect(execCommand).toHaveBeenCalledWith('insertText', false, 'Hello')
      // The manual fallback must not run when `execCommand` succeeds
      expect(input.value).toBe('')
    } finally {
      delete (document as {execCommand?: typeof execCommand}).execCommand
    }
  })

  it('does nothing for read-only inputs', () => {
    const input = createInput()
    input.readOnly = true
    const event = createPasteEvent(input, stega('Hello'))

    stripStegaFromPasteEvent(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(input.value).toBe('')
  })

  it('does nothing for disabled inputs', () => {
    const input = createInput()
    input.disabled = true
    const event = createPasteEvent(input, stega('Hello'))

    stripStegaFromPasteEvent(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('does nothing for non-textual inputs (e.g. checkboxes)', () => {
    const input = createInput({type: 'checkbox'})
    const event = createPasteEvent(input, stega('Hello'))

    stripStegaFromPasteEvent(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(input.value).toBe('on')
  })

  it('does nothing for non-input elements', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)
    const event = createPasteEvent(div, stega('Hello'))

    stripStegaFromPasteEvent(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('does not strip isolated zero-width joiners, such as those in emoji sequences', () => {
    const input = createInput()
    // Family emoji joined with zero-width joiners never has four or more consecutive
    // stega-alphabet characters, so it must be left untouched
    const event = createPasteEvent(input, '👨\u200d👩\u200d👧')

    stripStegaFromPasteEvent(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})
