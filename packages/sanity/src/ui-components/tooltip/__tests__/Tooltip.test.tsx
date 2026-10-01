/* oxlint-disable testing-library/prefer-user-event -- fake timers drive the mount/unmount delays, so the pointer and focus events are dispatched directly */
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, fireEvent, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {OVERLAY_EXIT_GRACE_MS} from '../../hooks/useOverlayContentMounted'
import {Tooltip} from '../Tooltip'

const theme = buildTheme()
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>
    <LayerProvider>{children}</LayerProvider>
  </ThemeProvider>
)

const TOOLTIP_TEXT = 'Field actions'

function renderTooltip(
  props: {disabled?: boolean; onMouseEnter?: () => void; onMouseLeave?: () => void} = {},
) {
  return render(
    <Tooltip content={TOOLTIP_TEXT} disabled={props.disabled}>
      <button type="button" onMouseEnter={props.onMouseEnter} onMouseLeave={props.onMouseLeave}>
        Reference
      </button>
    </Tooltip>,
    {wrapper},
  )
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('ui-components/Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not render the tooltip content until the reference is hovered', () => {
    const onMouseEnter = vi.fn()
    renderTooltip({onMouseEnter})
    const button = screen.getByRole('button', {name: 'Reference'})

    expect(screen.queryByText(TOOLTIP_TEXT)).not.toBeInTheDocument()

    fireEvent.mouseEnter(button)

    expect(onMouseEnter).toHaveBeenCalledTimes(1)
    expect(screen.getByText(TOOLTIP_TEXT)).toBeInTheDocument()

    // The open delay elapses and the tooltip shows, with the content already in place.
    advance(400)
    expect(screen.getByText(TOOLTIP_TEXT)).toBeInTheDocument()
  })

  it('keeps the reference element mounted across hover changes', () => {
    renderTooltip()
    const button = screen.getByRole('button', {name: 'Reference'})

    fireEvent.mouseEnter(button)
    expect(screen.getByRole('button', {name: 'Reference'})).toBe(button)

    fireEvent.mouseLeave(button)
    advance(OVERLAY_EXIT_GRACE_MS)
    expect(screen.getByRole('button', {name: 'Reference'})).toBe(button)
  })

  it('removes the tooltip content a moment after the pointer leaves', () => {
    const onMouseLeave = vi.fn()
    renderTooltip({onMouseLeave})
    const button = screen.getByRole('button', {name: 'Reference'})

    fireEvent.mouseEnter(button)
    fireEvent.mouseLeave(button)
    expect(onMouseLeave).toHaveBeenCalledTimes(1)

    // Still rendered for the close delay and exit animation...
    expect(screen.getByText(TOOLTIP_TEXT)).toBeInTheDocument()

    advance(OVERLAY_EXIT_GRACE_MS)

    // ...then gone.
    expect(screen.queryByText(TOOLTIP_TEXT)).not.toBeInTheDocument()
  })

  it('renders the tooltip content on keyboard focus and keeps it while focused', () => {
    renderTooltip()
    const button = screen.getByRole('button', {name: 'Reference'})

    fireEvent.focus(button)
    expect(screen.getByText(TOOLTIP_TEXT)).toBeInTheDocument()

    // Hovering and leaving while the button keeps focus does not drop the content.
    fireEvent.mouseEnter(button)
    fireEvent.mouseLeave(button)
    advance(OVERLAY_EXIT_GRACE_MS)
    expect(screen.getByText(TOOLTIP_TEXT)).toBeInTheDocument()

    fireEvent.blur(button)
    advance(OVERLAY_EXIT_GRACE_MS)
    expect(screen.queryByText(TOOLTIP_TEXT)).not.toBeInTheDocument()
  })

  it('renders nothing when disabled', () => {
    renderTooltip({disabled: true})

    fireEvent.mouseEnter(screen.getByRole('button', {name: 'Reference'}))
    advance(400)

    expect(screen.queryByText(TOOLTIP_TEXT)).not.toBeInTheDocument()
  })
})
