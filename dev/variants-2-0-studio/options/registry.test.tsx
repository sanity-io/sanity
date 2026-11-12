// `useOption` is read the way a component reads it: from inside a rendered component, so a switch has to re-render it.
import {act} from 'react'
import {createRoot} from 'react-dom/client'
// The Design options mechanism: what the picker lists, what a retired option answers, and that choosing an option reaches the code that reads it.
import {afterEach, describe, expect, it} from 'vitest'

import {getConfig} from '../design-options/config'
import {
  getOptionState,
  parseDesign,
  resetOptions,
  resetOverrides,
  setOverride,
  STOCK_OPTION,
  useOption,
} from '../design-options/store'
import {COMPONENTS, RETIRED} from './registry'

Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true})

async function renderHook(hook: () => string) {
  const result = {current: ''}
  function Probe() {
    result.current = hook()
    return null
  }
  const root = createRoot(document.createElement('div'))
  await act(async () => root.render(<Probe />))
  return {result, unmount: () => act(async () => root.unmount())}
}

afterEach(() => {
  resetOverrides()
  resetOptions()
})

describe('the picker lists no retired option', () => {
  it('has none of the retired ids among its components or in any group', () => {
    const retired = new Set(RETIRED.map((r) => r.id))
    expect(COMPONENTS.some((c) => retired.has(c.id))).toBe(false)
    for (const group of getConfig().groups) {
      expect(group.ids.some((id) => retired.has(id))).toBe(false)
      for (const id of group.ids) expect(COMPONENTS.some((c) => c.id === id)).toBe(true)
    }
  })

  it('has no dead entry: every component has options and a default that is one of them', () => {
    for (const component of COMPONENTS) {
      expect(component.options.length).toBeGreaterThan(0)
      expect(component.options.some((o) => o.id === component.defaultOption)).toBe(true)
    }
  })

  it('names the PR that replaces each retired option', () => {
    for (const entry of RETIRED) expect(entry.replacedBy).toMatch(/#\d+/)
  })

  it('keeps every saved preset applicable: it parses and names only registered options', () => {
    for (const preset of getConfig().presets ?? []) {
      const state = parseDesign(preset.design)
      expect(state, preset.id).not.toBeNull()
      for (const [component, option] of Object.entries(state!.overrides)) {
        const def = COMPONENTS.find((c) => c.id === component)
        expect(def, `${preset.id}: ${component}`).toBeDefined()
        expect(
          def!.options.some((o) => o.id === option),
          `${preset.id}: ${component}.${option}`,
        ).toBe(true)
      }
    }
  })
})

describe('a retired component answers the stock baseline', () => {
  it('returns the stock option for each retired id, whatever was saved', async () => {
    for (const entry of RETIRED) {
      const {result} = await renderHook(() => useOption(entry.id))
      expect(result.current, entry.id).toBe(STOCK_OPTION)
    }
  })
})

describe('choosing an option reaches the code that reads it', () => {
  it('switches the answer of useOption for the kept list option (C3: shipped flyout, then grouped by definition)', async () => {
    const {result} = await renderHook(() => useOption('c3'))
    expect(result.current).toBe('g')
    await act(async () => setOverride('c3', 'h'))
    expect(result.current).toBe('h')
    expect(getOptionState().overrides.c3).toBe('h')
  })

  it('switches every kept component to each of its options and back', async () => {
    for (const component of COMPONENTS) {
      const {result, unmount} = await renderHook(() => useOption(component.id))
      for (const option of component.options) {
        await act(async () => setOverride(component.id, option.id))
        expect(result.current, `${component.id}.${option.id}`).toBe(option.id)
      }
      await act(async () => setOverride(component.id, null))
      expect(result.current).toBe(component.defaultOption)
      await unmount()
    }
  })
})
