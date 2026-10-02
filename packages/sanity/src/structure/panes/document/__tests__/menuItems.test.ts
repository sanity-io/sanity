import {
  type DocumentIdStack,
  type DocumentInspector,
  type DocumentInspectorMenuItem,
  type TFunction,
} from 'sanity'
import {describe, expect, it} from 'vitest'

import {getMenuItems} from '../menuItems'
import {buildResolvedFeatures, EMPTY_FEATURES} from './featuresFixture'

const t = ((key: string) => key) as unknown as TFunction

const documentIdStack: DocumentIdStack = {
  position: 1,
  previousId: 'doc-0',
  stack: ['doc-0', 'doc-1'],
}

function getParams(overrides: Partial<Parameters<typeof getMenuItems>[0]> = {}) {
  return {
    features: buildResolvedFeatures(),
    hasValue: true,
    inspectors: [],
    inspectorMenuItems: [],
    t,
    displayInlineChanges: false,
    ...overrides,
  }
}

describe('getMenuItems', () => {
  it('returns the overflow items the features resolution kept', () => {
    const items = getMenuItems(getParams({previewUrl: 'https://example.com', documentIdStack}))

    expect(items.map((item) => item.action)).toEqual([
      'inspect',
      'production-preview',
      'compareVersions',
      'toggleInlineChanges',
    ])
  })

  it('carries the shortcut of an enabled item', () => {
    const items = getMenuItems(getParams({previewUrl: 'https://example.com'}))

    expect(items.find((item) => item.action === 'inspect')).toMatchObject({
      action: 'inspect',
      shortcut: 'Ctrl+Alt+I',
    })
    expect(items.find((item) => item.action === 'production-preview')).toMatchObject({
      action: 'production-preview',
      shortcut: 'Ctrl+Alt+O',
    })
  })

  it('returns no menu items when the resolution kept none of them', () => {
    const items = getMenuItems(
      getParams({
        features: EMPTY_FEATURES,
        previewUrl: 'https://example.com',
        documentIdStack,
      }),
    )

    expect(items).toEqual([])
  })

  const GATE_CASES = [
    {name: 'inspect', action: 'inspect', shortcut: 'Ctrl+Alt+I'},
    {name: 'productionPreview', action: 'production-preview', shortcut: 'Ctrl+Alt+O'},
    {name: 'compareVersions', action: 'compareVersions', shortcut: undefined},
    {name: 'inlineChanges', action: 'toggleInlineChanges', shortcut: undefined},
  ] as const

  it.each(GATE_CASES)('renders $action when $name is in the resolution', ({action, shortcut}) => {
    const items = getMenuItems(getParams({previewUrl: 'https://example.com', documentIdStack}))

    const item = items.find((candidate) => candidate.action === action)

    expect(item).toBeDefined()
    expect(item?.shortcut).toBe(shortcut)
  })

  it.each(GATE_CASES)(
    'drops $action when $name is not in the resolution, keeping the rest',
    ({name, action, shortcut}) => {
      const items = getMenuItems(
        getParams({
          features: buildResolvedFeatures({without: [name]}),
          previewUrl: 'https://example.com',
          documentIdStack,
        }),
      )

      expect(items.find((item) => item.action === action)).toBeUndefined()
      expect(items).toHaveLength(GATE_CASES.length - 1)

      if (shortcut) {
        expect(items.find((item) => item.shortcut === shortcut)).toBeUndefined()
      }
    },
  )

  it('omits the production preview item when there is no preview url', () => {
    const items = getMenuItems(getParams())

    expect(items.find((item) => item.action === 'production-preview')).toBeUndefined()
  })

  it('keeps the reason for the disabled state when no previous document exists', () => {
    const items = getMenuItems(getParams())

    expect(items.find((item) => item.action === 'compareVersions')).toMatchObject({
      disabled: {reason: 'compare-versions.menu-item.disabled-reason'},
    })
  })

  it('leaves compareVersions usable when a previous document exists', () => {
    const items = getMenuItems(getParams({documentIdStack}))

    expect(items.find((item) => item.action === 'compareVersions')).toMatchObject({
      action: 'compareVersions',
      disabled: false,
    })
  })

  describe('inspector items', () => {
    const validationInspector = {name: 'validation', component: () => null} as DocumentInspector
    const jsonInspector = {name: 'json', component: () => null} as DocumentInspector

    const validationMenuItem: DocumentInspectorMenuItem = {
      title: 'Validation',
      showAsAction: true,
      hotkeys: ['Ctrl', 'Alt', 'V'],
    }
    const jsonMenuItem: DocumentInspectorMenuItem = {title: 'JSON'}

    function getInspectorParams(overrides: Partial<Parameters<typeof getMenuItems>[0]> = {}) {
      return getParams({
        inspectors: [validationInspector, jsonInspector],
        inspectorMenuItems: [validationMenuItem, jsonMenuItem],
        previewUrl: 'https://example.com',
        documentIdStack,
        ...overrides,
      })
    }

    it('renders every inspector item alongside the built-in overflow items', () => {
      const items = getMenuItems(getInspectorParams())

      expect(items.map((item) => item.action)).toEqual([
        'inspect:validation',
        'inspect:json',
        'inspect',
        'production-preview',
        'compareVersions',
        'toggleInlineChanges',
      ])
    })

    it('leaves inspector items alone when the resolution kept no built-in overflow feature', () => {
      const items = getMenuItems(getInspectorParams({features: EMPTY_FEATURES}))

      expect(items.map((item) => item.action)).toEqual(['inspect:validation', 'inspect:json'])
      expect(items.find((item) => item.action === 'inspect:validation')).toMatchObject({
        showAsAction: true,
        shortcut: 'Ctrl+Alt+V',
      })
      expect(items.find((item) => item.action === 'inspect:json')?.disabled).toBe(false)
    })

    it('disables the inspector items when the document has no value', () => {
      const items = getMenuItems(getInspectorParams({hasValue: false}))

      expect(items.find((item) => item.action === 'inspect:json')?.disabled).toBe(true)
    })
  })
})
