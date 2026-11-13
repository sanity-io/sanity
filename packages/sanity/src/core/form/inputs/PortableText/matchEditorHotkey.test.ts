// @vitest-environment node
import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {tmpdir} from 'node:os'
import {dirname, join} from 'node:path'
import {pathToFileURL} from 'node:url'

import {afterEach, describe, expect, it, vi} from 'vitest'

import {type HotkeyMatchEvent} from './matchEditorHotkey'

type EditorIsHotkey = (hotkey: string, event: HotkeyMatchEvent) => boolean

interface EditorTables {
  aliases: Record<string, string>
  keyCodes: Record<string, number>
  isHotkey: EditorIsHotkey
}

/** The editor does not export its matcher, so its own source is evaluated */
async function loadEditorMatcher(isMac: boolean): Promise<EditorTables> {
  const require = createRequire(import.meta.url)
  const editorDir = dirname(require.resolve('@portabletext/editor/package.json'))
  const source = readFileSync(join(editorDir, 'lib/index.js'), 'utf8')
  const start = source.indexOf('modifiers = {')
  const end = source.indexOf('const reservedHotkeys')
  if (start < 0 || end < start) throw new Error('The editor matcher was not found')
  const file = join(mkdtempSync(join(tmpdir(), 'editor-hotkey-')), 'matcher.mjs')
  writeFileSync(
    file,
    `const IS_MAC = ${isMac}\nconst ${source.slice(start, end)}\nexport {aliases, keyCodes, isHotkey}`,
  )
  return import(/* @vite-ignore */ pathToFileURL(file).href)
}

const MODIFIER_NAMES = ['alt', 'ctrl', 'shift', 'meta']
const MODIFIER_PROPERTIES = ['altKey', 'ctrlKey', 'shiftKey', 'metaKey'] as const

function modifierPrefixes(extra: string[]): string[] {
  const prefixes: string[] = ['']
  for (const name of [...MODIFIER_NAMES, ...extra]) {
    const next: string[] = []
    for (const prefix of prefixes) {
      next.push(prefix)
      next.push(`${prefix}${name}+`)
      next.push(`${prefix}${name}?+`)
    }
    prefixes.length = 0
    prefixes.push(...next)
  }
  return prefixes
}

function modifierEvents(): Pick<HotkeyMatchEvent, (typeof MODIFIER_PROPERTIES)[number]>[] {
  return Array.from({length: 16}, (_, bits) => ({
    altKey: Boolean(bits & 1),
    ctrlKey: Boolean(bits & 2),
    shiftKey: Boolean(bits & 4),
    metaKey: Boolean(bits & 8),
  }))
}

async function loadStudioMatcher(isMac: boolean) {
  vi.resetModules()
  vi.stubGlobal('window', {navigator: {userAgent: isMac ? 'Mac' : 'Linux'}})
  return (await import('./matchEditorHotkey')).matchEditorHotkey
}

function outcome(run: () => boolean): string {
  try {
    return String(run())
  } catch (error) {
    return `${error instanceof Error ? error.constructor.name : typeof error}: ${
      error instanceof Error ? error.message : String(error)
    }`
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('matchEditorHotkey', () => {
  describe.each([false, true])('on a Mac: %s', (isMac) => {
    it(
      'agrees with the matcher of @portabletext/editor on every pair',
      {timeout: 60_000},
      async () => {
        const editor = await loadEditorMatcher(isMac)
        const studio = await loadStudioMatcher(isMac)

        const names = [
          ...Object.keys(editor.aliases),
          ...Object.keys(editor.keyCodes),
          ...'abcdefghijklmnopqrstuvwxyz0123456789'.split(''),
          'A',
          'F5',
          'ArrowLeft',
          'CTRL',
          '+',
          'f21',
          'foo',
          '',
        ]
        const keyAndCode = (name: string) => {
          const key = editor.aliases[name.toLowerCase()] ?? name
          return {key, keyCode: editor.keyCodes[key.toLowerCase()]}
        }
        const prefixes = modifierPrefixes([])
        const modifiers = modifierEvents()
        let pairs = 0
        const disagreements: string[] = []

        for (const name of names) {
          const {key, keyCode} = keyAndCode(name)
          const keyVariants: Pick<HotkeyMatchEvent, 'key' | 'keyCode'>[] = [
            {key, keyCode},
            {key, keyCode: undefined},
            {key: key.toUpperCase(), keyCode: undefined},
            {key: 'Unidentified', keyCode},
            {key, keyCode: 93},
            {key, keyCode: 0},
            {key: '', keyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : keyCode},
          ]
          for (const prefix of prefixes) {
            for (const hotkey of [`${prefix}${name}`, `${prefix}${name}?`]) {
              for (const keyVariant of keyVariants) {
                for (const modifier of modifiers) {
                  const event = {...modifier, ...keyVariant}
                  pairs++
                  const expected = outcome(() => editor.isHotkey(hotkey, event))
                  const actual = outcome(() => studio(hotkey, event))
                  if (expected !== actual) {
                    disagreements.push(
                      `${hotkey} ${JSON.stringify(event)}: ${expected} / ${actual}`,
                    )
                  }
                }
              }
            }
          }
        }

        for (const hotkey of ['mod+a', 'mod?+a', 'ctrl++', '++', 'shift++', 'ctrl+shift++', '+']) {
          for (const keyVariant of [
            {key: '+', keyCode: 43},
            {key: '+', keyCode: undefined},
            {key: 'a', keyCode: 65},
          ]) {
            for (const modifier of modifiers) {
              const event = {...modifier, ...keyVariant}
              pairs++
              const expected = outcome(() => editor.isHotkey(hotkey, event))
              if (expected !== outcome(() => studio(hotkey, event))) {
                disagreements.push(`${hotkey} ${JSON.stringify(event)}`)
              }
            }
          }
        }

        for (const hotkey of [
          'f20',
          'ctrl+f20',
          'f21',
          'ctrl+f21',
          'foo',
          'ctrl+foo+a',
          'ctrl+',
          '',
        ]) {
          pairs++
          const event = {...modifiers[0], key: 'F20', keyCode: 131}
          const expected = outcome(() => editor.isHotkey(hotkey, event))
          if (expected !== outcome(() => studio(hotkey, event))) disagreements.push(hotkey)
        }

        expect(pairs).toBeGreaterThan(2_000_000)
        expect(disagreements.slice(0, 20)).toEqual([])
      },
    )
  })

  it('knows F20 and rejects F21 like the editor', async () => {
    const studio = await loadStudioMatcher(false)
    const event = {altKey: false, ctrlKey: true, metaKey: false, shiftKey: false}

    expect(studio('ctrl+f20', {...event, key: 'F20', keyCode: 131})).toBe(true)
    expect(() => studio('ctrl+f21', {...event, key: 'F21', keyCode: 132})).toThrow(
      'Unknown modifier: "f21"',
    )
  })
})
