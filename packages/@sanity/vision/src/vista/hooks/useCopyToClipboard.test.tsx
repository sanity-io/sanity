import {act, cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useCopyToClipboard} from './useCopyToClipboard'

const toastMocks = vi.hoisted(() => ({push: vi.fn()}))

vi.mock('@sanity/ui/toast', () => ({
  useToast: () => toastMocks,
}))

function CopyButton() {
  const copy = useCopyToClipboard()
  return (
    <button onClick={() => void copy('the text', 'Copied')} type="button">
      Copy
    </button>
  )
}

describe('useCopyToClipboard', () => {
  const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  let execCommand: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // The fallback path: no async clipboard API (insecure contexts, some webviews)
    Object.defineProperty(navigator, 'clipboard', {value: undefined, configurable: true})
    execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', {value: execCommand, configurable: true})
    // Browsers focus a textarea when it is selected; jsdom only sets the selection
    vi.spyOn(HTMLTextAreaElement.prototype, 'select').mockImplementation(function select(
      this: HTMLTextAreaElement,
    ) {
      this.focus()
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard)
    else Reflect.deleteProperty(navigator, 'clipboard')
    Reflect.deleteProperty(document, 'execCommand')
  })

  it('copies through a temporary textarea and gives focus back to the control that copied', async () => {
    render(<CopyButton />)
    const button = screen.getByRole('button', {name: 'Copy'})
    button.focus()
    expect(document.activeElement).toBe(button)

    await act(async () => {
      fireEvent.click(button)
    })

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
    expect(document.activeElement).toBe(button)
    expect(toastMocks.push).toHaveBeenCalledWith(
      expect.objectContaining({status: 'success', title: 'Copied'}),
    )
  })

  it('reports a refused copy and still gives focus back', async () => {
    execCommand.mockReturnValue(false)
    render(<CopyButton />)
    const button = screen.getByRole('button', {name: 'Copy'})
    button.focus()

    await act(async () => {
      fireEvent.click(button)
    })

    expect(document.querySelector('textarea')).toBeNull()
    expect(document.activeElement).toBe(button)
    expect(toastMocks.push).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        title: 'Copying to the clipboard is not allowed here',
      }),
    )
  })

  it('leaves focus alone when nothing was focused before', async () => {
    render(<CopyButton />)
    const button = screen.getByRole('button', {name: 'Copy'})
    expect(document.activeElement).toBe(document.body)

    await act(async () => {
      fireEvent.click(button)
    })

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.activeElement).toBe(document.body)
  })
})
