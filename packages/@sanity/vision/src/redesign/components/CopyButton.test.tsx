import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {COPIED_FEEDBACK_MS, CopyButton} from './CopyButton'

vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

const theme = buildTheme()

function renderButton(onCopy: () => Promise<boolean>, disabled?: boolean) {
  render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <CopyButton disabled={disabled} onCopy={onCopy} />
      </LayerProvider>
    </ThemeProvider>,
  )
}

const button = () => screen.getByTestId('vision-copy')
const copied = () => button().getAttribute('data-copied') === 'true'
const shownLabel = () => button().textContent?.trim()
const shownIcon = () =>
  button().querySelector('[data-sanity-icon]')?.getAttribute('data-sanity-icon')

async function click() {
  await act(async () => {
    fireEvent.click(button())
  })
}

describe('CopyButton', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('reads Copy with the copy icon until it copies', () => {
    renderButton(() => Promise.resolve(true))
    expect(copied()).toBe(false)
    expect(shownLabel()).toBe('vision.copy')
    expect(shownIcon()).toBe('copy')
  })

  it('reads Copied with a checkmark for a few seconds after a copy', async () => {
    const onCopy = vi.fn(() => Promise.resolve(true))
    renderButton(onCopy)

    await click()
    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(copied()).toBe(true)
    expect(shownLabel()).toBe('vision.copied')
    expect(shownIcon()).toBe('checkmark')

    act(() => {
      vi.advanceTimersByTime(COPIED_FEEDBACK_MS - 1)
    })
    expect(copied()).toBe(true)
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(copied()).toBe(false)
    expect(shownLabel()).toBe('vision.copy')
    expect(shownIcon()).toBe('copy')
  })

  it('reads Copied longer when copied again meanwhile', async () => {
    renderButton(() => Promise.resolve(true))
    await click()
    act(() => {
      vi.advanceTimersByTime(COPIED_FEEDBACK_MS - 500)
    })
    await click()
    act(() => {
      vi.advanceTimersByTime(COPIED_FEEDBACK_MS - 1)
    })
    expect(copied()).toBe(true)
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(copied()).toBe(false)
  })

  it('keeps reading Copy when the copy failed', async () => {
    renderButton(() => Promise.resolve(false))
    await click()
    expect(copied()).toBe(false)
  })

  it('copies nothing while disabled', async () => {
    const onCopy = vi.fn(() => Promise.resolve(true))
    renderButton(onCopy, true)
    await click()
    expect(onCopy).not.toHaveBeenCalled()
  })
})
