import {createEvent} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {matchVisionTabShortcut} from './shortcuts'

// Before the shortcuts module and `is-hotkey` read the platform as they load
vi.hoisted(() => {
  Object.defineProperty(navigator, 'platform', {configurable: true, value: 'Win32'})
})

/** A keydown with the `which` code browsers report for its key, which `is-hotkey` matches on */
function keydown(init: Record<string, unknown>): KeyboardEvent {
  const event = createEvent.keyDown(document, init)
  if (!(event instanceof KeyboardEvent)) throw new Error('Expected a keyboard event')
  return event
}

describe('tab shortcuts on Windows', () => {
  it('also close the tab with Ctrl+F4, VS Code’s main key for it there', () => {
    expect(matchVisionTabShortcut(keydown({key: 'F4', which: 115, ctrlKey: true}))).toBe(
      'close-tab',
    )
  })

  it('let AltGr type, which Windows emulates with Ctrl+Alt', () => {
    // AltGr+N types ń with the Polish layout. Chrome and Firefox report a key that types with Ctrl
    // and Alt held as AltGraph alone, without Ctrl and Alt
    expect(
      matchVisionTabShortcut(keydown({key: 'ń', which: 78, modifierAltGraph: true})),
    ).toBeNull()
    expect(
      matchVisionTabShortcut(keydown({key: 'n', which: 78, ctrlKey: true, altKey: true})),
    ).toBe('new-tab')
  })
})
