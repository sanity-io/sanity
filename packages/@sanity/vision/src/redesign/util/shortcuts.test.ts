import {createEvent} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {
  matchVisionShortcut,
  matchVisionTabShortcut,
  VISION_TAB_SHORTCUTS,
  type VisionTabShortcutId,
} from './shortcuts'

/** A keydown with the `which` code browsers report for its key, which `is-hotkey` matches on */
function keydown(init: Record<string, unknown>): KeyboardEvent {
  const event = createEvent.keyDown(document, init)
  if (!(event instanceof KeyboardEvent)) throw new Error('Expected a keyboard event')
  return event
}

/** jsdom reports no platform, which the shortcuts take for Linux */
const TAB_KEYS: [VisionTabShortcutId, Record<string, unknown>][] = [
  ['new-tab', {key: 'n', which: 78, ctrlKey: true}],
  ['new-tab', {key: 'n', which: 78, ctrlKey: true, altKey: true}],
  ['close-tab', {key: 'w', which: 87, ctrlKey: true}],
  ['close-tab', {key: 'w', which: 87, ctrlKey: true, altKey: true}],
  ['next-tab', {key: 'Tab', which: 9, ctrlKey: true}],
  ['next-tab', {key: 'PageDown', which: 34, ctrlKey: true, altKey: true}],
  ['previous-tab', {key: 'Tab', which: 9, ctrlKey: true, shiftKey: true}],
  ['previous-tab', {key: 'PageUp', which: 33, ctrlKey: true, altKey: true}],
]

describe('tab shortcuts on Linux', () => {
  it('take VS Code’s keys, and keys close to them that browsers leave to the page', () => {
    for (const [shortcut, init] of TAB_KEYS) {
      expect(matchVisionTabShortcut(keydown(init))).toBe(shortcut)
    }
  })

  it('are none of Vision’s other shortcuts', () => {
    for (const [, init] of TAB_KEYS) {
      expect(matchVisionShortcut(keydown(init))).toBeNull()
    }
  })

  it('leave moving the focus and paging in the editor alone', () => {
    for (const init of [
      {key: 'Tab', which: 9},
      {key: 'Tab', which: 9, shiftKey: true},
      {key: 'PageDown', which: 34},
      {key: 'PageUp', which: 33},
    ]) {
      expect(matchVisionTabShortcut(keydown(init))).toBeNull()
    }
  })

  it('show the keys browsers leave to the page', () => {
    expect(VISION_TAB_SHORTCUTS['new-tab'].keys).toEqual(['Ctrl', 'Alt', 'N'])
    expect(VISION_TAB_SHORTCUTS['close-tab'].keys).toEqual(['Ctrl', 'Alt', 'W'])
    expect(VISION_TAB_SHORTCUTS['next-tab'].keys).toEqual(['Ctrl', 'Alt', 'PageDown'])
    expect(VISION_TAB_SHORTCUTS['previous-tab'].keys).toEqual(['Ctrl', 'Alt', 'PageUp'])
  })
})
