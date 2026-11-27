import {createEvent} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {matchVisionTabShortcut, VISION_TAB_SHORTCUTS, type VisionTabShortcutId} from './shortcuts'

// Before the shortcuts module and `is-hotkey` read the platform as they load
vi.hoisted(() => {
  Object.defineProperty(navigator, 'platform', {configurable: true, value: 'MacIntel'})
})

/** A keydown with the `which` code browsers report for its key, which `is-hotkey` matches on */
function keydown(init: Record<string, unknown>): KeyboardEvent {
  const event = createEvent.keyDown(document, init)
  if (!(event instanceof KeyboardEvent)) throw new Error('Expected a keyboard event')
  return event
}

const TAB_KEYS: [VisionTabShortcutId, Record<string, unknown>][] = [
  ['new-tab', {key: 'n', which: 78, metaKey: true}],
  ['new-tab', {key: 'n', which: 78, metaKey: true, altKey: true}],
  ['close-tab', {key: 'w', which: 87, metaKey: true}],
  ['close-tab', {key: 'w', which: 87, metaKey: true, altKey: true}],
  ['next-tab', {key: 'Tab', which: 9, ctrlKey: true}],
  ['next-tab', {key: ']', which: 221, metaKey: true, altKey: true}],
  ['previous-tab', {key: 'Tab', which: 9, ctrlKey: true, shiftKey: true}],
  ['previous-tab', {key: '[', which: 219, metaKey: true, altKey: true}],
]

describe('tab shortcuts on a Mac', () => {
  it('take VS Code’s keys, and keys close to them that browsers leave to the page', () => {
    for (const [shortcut, init] of TAB_KEYS) {
      expect(matchVisionTabShortcut(keydown(init))).toBe(shortcut)
    }
  })

  it('match in Firefox too, which reports every press of Option as AltGraph', () => {
    for (const [shortcut, init] of TAB_KEYS.filter(([, {altKey}]) => altKey)) {
      expect(matchVisionTabShortcut(keydown({...init, modifierAltGraph: true}))).toBe(shortcut)
    }
  })

  it('leave Ctrl+N and the keys of Windows and Linux to the editor', () => {
    // Ctrl+N moves the cursor down a line in a Mac text field, and in the query editor
    expect(matchVisionTabShortcut(keydown({key: 'n', which: 78, ctrlKey: true}))).toBeNull()
    expect(
      matchVisionTabShortcut(keydown({key: 'PageDown', which: 34, ctrlKey: true, altKey: true})),
    ).toBeNull()
  })

  it('show the keys browsers leave to the page, with the Mac modifier symbols', () => {
    expect(VISION_TAB_SHORTCUTS['new-tab'].keys).toEqual(['⌘', '⌥', 'N'])
    expect(VISION_TAB_SHORTCUTS['close-tab'].keys).toEqual(['⌘', '⌥', 'W'])
    expect(VISION_TAB_SHORTCUTS['next-tab'].keys).toEqual(['⌘', '⌥', ']'])
    expect(VISION_TAB_SHORTCUTS['previous-tab'].keys).toEqual(['⌘', '⌥', '['])
    expect(VISION_TAB_SHORTCUTS['new-tab'].vscodeKeys).toEqual(['⌘', 'N'])
  })
})
