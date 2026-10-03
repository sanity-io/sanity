/* oxlint-disable testing-library/prefer-user-event -- fake timers drive the mount/unmount grace, so the pointer, focus and click events are dispatched directly */
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {buildTheme} from '@sanity/ui/theme'
import {act, fireEvent, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {OVERLAY_EXIT_GRACE_MS} from '../../hooks/useOverlayContentMounted'
import {MenuItem} from '../../menuItem/MenuItem'
import {MenuButton} from '../MenuButton'

const theme = buildTheme()
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>
    <LayerProvider>{children}</LayerProvider>
  </ThemeProvider>
)

function renderMenuButton(props: {
  onOpen?: () => void
  onClose?: () => void
  onPointerDown?: () => void
  onFocus?: () => void
}) {
  const {onClose, onFocus, onOpen, onPointerDown} = props

  return render(
    <MenuButton
      button={
        <button type="button" onFocus={onFocus} onPointerDown={onPointerDown}>
          Open menu
        </button>
      }
      id="test-menu"
      menu={
        <Menu>
          <MenuItem text="First item" />
          <MenuItem text="Second item" />
        </Menu>
      }
      onClose={onClose}
      onOpen={onOpen}
    />,
    {wrapper},
  )
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('ui-components/MenuButton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not mount the menu while closed', () => {
    renderMenuButton({})

    expect(screen.getByRole('button', {name: 'Open menu'})).toBeInTheDocument()
    expect(screen.queryByText('First item')).not.toBeInTheDocument()
  })

  it('mounts the menu on pointer down, before the click opens it', () => {
    const onPointerDown = vi.fn()
    renderMenuButton({onPointerDown})
    const button = screen.getByRole('button', {name: 'Open menu'})

    fireEvent.pointerDown(button)

    expect(onPointerDown).toHaveBeenCalledTimes(1)
    expect(screen.getByText('First item')).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', {name: 'First item'})).toBeInTheDocument()
  })

  it('keeps the menu through the touch sequence, where pointerleave precedes click', () => {
    renderMenuButton({})
    const button = screen.getByRole('button', {name: 'Open menu'})

    fireEvent.pointerDown(button)
    fireEvent.pointerUp(button)
    fireEvent.pointerLeave(button)
    expect(screen.getByText('First item')).toBeInTheDocument()

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')

    // Open keeps it mounted well past the grace.
    advance(OVERLAY_EXIT_GRACE_MS * 2)
    expect(screen.getByRole('menuitem', {name: 'First item'})).toBeInTheDocument()
  })

  it('mounts the menu on focus and chains the button handler', () => {
    const onFocus = vi.fn()
    renderMenuButton({onFocus})

    fireEvent.focus(screen.getByRole('button', {name: 'Open menu'}))

    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(screen.getByText('First item')).toBeInTheDocument()
  })

  it('drops the menu again when the button is left without opening it', () => {
    renderMenuButton({})
    const button = screen.getByRole('button', {name: 'Open menu'})

    fireEvent.pointerDown(button)
    fireEvent.pointerLeave(button)
    expect(screen.getByText('First item')).toBeInTheDocument()

    advance(OVERLAY_EXIT_GRACE_MS)
    expect(screen.queryByText('First item')).not.toBeInTheDocument()

    fireEvent.focus(button)
    expect(screen.getByText('First item')).toBeInTheDocument()

    fireEvent.blur(button)
    advance(OVERLAY_EXIT_GRACE_MS)
    expect(screen.queryByText('First item')).not.toBeInTheDocument()
  })

  it('mounts the menu for an open that was not preceded by pointer or focus events', () => {
    const onOpen = vi.fn()
    renderMenuButton({onOpen})

    fireEvent.click(screen.getByRole('button', {name: 'Open menu'}))

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('menuitem', {name: 'First item'})).toBeInTheDocument()
  })

  it('keeps the menu through the exit animation, then unmounts it', () => {
    const onClose = vi.fn()
    renderMenuButton({onClose})
    const button = screen.getByRole('button', {name: 'Open menu'})

    fireEvent.click(button)
    expect(screen.getByRole('menuitem', {name: 'First item'})).toBeInTheDocument()

    fireEvent.click(button)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('First item')).toBeInTheDocument()

    advance(OVERLAY_EXIT_GRACE_MS)

    expect(screen.queryByText('First item')).not.toBeInTheDocument()
  })
})
