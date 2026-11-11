import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {useStableMenuWidth} from './useStableMenuWidth'

function Probe() {
  const {menuRef, menuStyle, lockMenuWidth, resetMenuWidth} = useStableMenuWidth()

  return (
    <>
      <div data-testid="menu" ref={menuRef} style={menuStyle} />
      <button type="button" onClick={lockMenuWidth}>
        open
      </button>
      <button type="button" onClick={resetMenuWidth}>
        reset
      </button>
    </>
  )
}

function setOffsetWidth(element: HTMLElement, width: number) {
  Object.defineProperty(element, 'offsetWidth', {configurable: true, value: width})
}

describe('useStableMenuWidth', () => {
  let frames: FrameRequestCallback[] = []

  afterEach(() => {
    vi.unstubAllGlobals()
    frames = []
  })

  function installFrames() {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      frames[id - 1] = () => {}
    })
  }

  async function flushFrame() {
    const pending = frames.splice(0)
    await act(async () => {
      for (const callback of pending) callback(0)
    })
  }

  it('locks the width once the opened menu has laid out', async () => {
    installFrames()
    const user = userEvent.setup()
    render(<Probe />)
    const menu = screen.getByTestId('menu')
    setOffsetWidth(menu, 320)

    await user.click(screen.getByRole('button', {name: 'open'}))
    expect(menu.style.width).toBe('')

    await flushFrame()

    expect(menu).toHaveStyle({width: '320px', minWidth: '320px', maxWidth: '320px'})

    setOffsetWidth(menu, 200)
    await flushFrame()

    expect(menu).toHaveStyle({width: '320px', minWidth: '320px', maxWidth: '320px'})
  })

  it('measures again the next time the menu opens', async () => {
    installFrames()
    const user = userEvent.setup()
    render(<Probe />)
    const menu = screen.getByTestId('menu')

    setOffsetWidth(menu, 320)
    await user.click(screen.getByRole('button', {name: 'open'}))
    await flushFrame()

    await user.click(screen.getByRole('button', {name: 'reset'}))
    expect(menu.style.width).toBe('')

    setOffsetWidth(menu, 400)
    await user.click(screen.getByRole('button', {name: 'open'}))
    await flushFrame()

    expect(menu).toHaveStyle({width: '400px', minWidth: '400px', maxWidth: '400px'})
  })

  it('waits until the menu has a width before locking', async () => {
    installFrames()
    const user = userEvent.setup()
    render(<Probe />)
    const menu = screen.getByTestId('menu')

    await user.click(screen.getByRole('button', {name: 'open'}))
    await flushFrame()
    expect(menu.style.width).toBe('')

    setOffsetWidth(menu, 280)
    await flushFrame()

    expect(menu).toHaveStyle({width: '280px', minWidth: '280px', maxWidth: '280px'})
  })
})
