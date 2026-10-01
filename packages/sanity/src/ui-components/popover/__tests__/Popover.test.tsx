import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {OVERLAY_EXIT_GRACE_MS} from '../../hooks/useOverlayContentMounted'
import {Popover} from '../Popover'

const theme = buildTheme()
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>
    <LayerProvider>{children}</LayerProvider>
  </ThemeProvider>
)

function renderPopover(open: boolean) {
  return render(
    <Popover content={<div data-testid="popover-content">Hello</div>} open={open} portal>
      <button type="button">Reference</button>
    </Popover>,
    {wrapper},
  )
}

describe('ui-components/Popover', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not mount the content while closed', () => {
    renderPopover(false)

    expect(screen.getByRole('button', {name: 'Reference'})).toBeInTheDocument()
    expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument()
  })

  it('mounts the content when opened', () => {
    const {rerender} = renderPopover(false)

    rerender(
      <Popover content={<div data-testid="popover-content">Hello</div>} open portal>
        <button type="button">Reference</button>
      </Popover>,
    )

    expect(screen.getByTestId('popover-content')).toBeInTheDocument()
  })

  it('keeps the content through the exit animation and unmounts it afterwards', () => {
    const {rerender} = renderPopover(true)
    expect(screen.getByTestId('popover-content')).toBeInTheDocument()

    rerender(
      <Popover content={<div data-testid="popover-content">Hello</div>} open={false} portal>
        <button type="button">Reference</button>
      </Popover>,
    )

    // Still mounted right after closing, so the card has content while it animates out.
    expect(screen.getByTestId('popover-content')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(OVERLAY_EXIT_GRACE_MS)
    })

    expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument()
  })

  it('keeps the content when reopened during the exit animation', () => {
    const {rerender} = renderPopover(true)

    rerender(
      <Popover content={<div data-testid="popover-content">Hello</div>} open={false} portal>
        <button type="button">Reference</button>
      </Popover>,
    )
    rerender(
      <Popover content={<div data-testid="popover-content">Hello</div>} open portal>
        <button type="button">Reference</button>
      </Popover>,
    )

    act(() => {
      vi.advanceTimersByTime(OVERLAY_EXIT_GRACE_MS * 2)
    })

    expect(screen.getByTestId('popover-content')).toBeInTheDocument()
  })
})
