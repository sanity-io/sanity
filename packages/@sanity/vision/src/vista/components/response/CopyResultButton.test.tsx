import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {COPIED_FEEDBACK_MS, CopyResultButton} from './CopyResultButton'

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

function renderButton(onCopy: () => Promise<boolean>) {
  render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <CopyResultButton label="Copy result" onCopy={onCopy} />
      </LayerProvider>
    </ThemeProvider>,
  )
}

const copied = () =>
  screen.getByTestId('vista-copy-result-glyphs').getAttribute('data-copied') === 'true'

async function click() {
  await act(async () => {
    fireEvent.click(screen.getByTestId('vista-copy-result'))
  })
}

describe('CopyResultButton', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('shows a checkmark for a moment after the result was copied', async () => {
    const onCopy = vi.fn(() => Promise.resolve(true))
    renderButton(onCopy)
    expect(copied()).toBe(false)

    await click()
    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(copied()).toBe(true)

    act(() => {
      vi.advanceTimersByTime(COPIED_FEEDBACK_MS - 1)
    })
    expect(copied()).toBe(true)
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(copied()).toBe(false)
  })

  it('keeps the checkmark longer when copied again while it shows', async () => {
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

  it('shows no checkmark when the copy failed', async () => {
    renderButton(() => Promise.resolve(false))
    await click()
    expect(copied()).toBe(false)
  })
})
