import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createDocumentFeaturesReducer} from '../../configPropertyReducers'
import {flattenConfig} from '../../flattenConfig'
import {resolveConfigProperty} from '../../resolveConfigProperty'
import {type PluginOptions} from '../../types'
import {
  type DocumentFeature,
  type DocumentFeatureHeaderEntry,
  type DocumentFeatureMenuEntry,
} from '../features'
import {type DocumentFieldAction} from '../fieldActions/types'
import {type DocumentInspector} from '../inspector'
import {
  finalizeDocumentFeatures,
  SANITY_DEFINED_FEATURES,
  seedDocumentFeatures,
  stripToRegistered,
} from '../resolveDocumentFeatures'

function Panel() {
  return null
}

function Renderer() {
  return null
}

function OtherRenderer() {
  return null
}

const validationInspector: DocumentInspector = {
  name: 'sanity/structure/validation',
  component: Panel,
}
const historyInspector: DocumentInspector = {name: 'sanity/structure/history', component: Panel}
const assistInspector: DocumentInspector = {name: 'ai-assistance', component: Panel}

const copyField: DocumentFieldAction = {name: 'copyField', useAction: () => ({}) as never}
const pasteField: DocumentFieldAction = {name: 'pasteField', useAction: () => ({}) as never}
const assistActions: DocumentFieldAction = {
  name: 'sanity-assist-actions',
  useAction: () => ({}) as never,
}

const HEADER_ENTRY: DocumentFeatureHeaderEntry = {placement: 'header', render: Renderer}
const OTHER_HEADER_ENTRY: DocumentFeatureHeaderEntry = {placement: 'header', render: OtherRenderer}
const MENU_ENTRY: DocumentFeatureMenuEntry = {
  placement: 'menu',
  title: 'Close pane',
  onAction: () => {},
}

const SPLIT_PANE: DocumentFeature = {name: 'splitPane', toolbar: HEADER_ENTRY}
const FOCUS_MODE: DocumentFeature = {name: 'focusMode', toolbar: HEADER_ENTRY}
const CLOSE_PANE: DocumentFeature = {name: 'closePane', toolbar: MENU_ENTRY}

const validationFeature: DocumentFeature = {name: 'validation', inspector: validationInspector}
const historyFeature: DocumentFeature = {name: 'history', inspector: historyInspector}
const assistFeature: DocumentFeature = {
  name: 'ai-assistance',
  inspector: assistInspector,
  fieldAction: assistActions,
}

const BUILT_IN_NAMES = SANITY_DEFINED_FEATURES.map((feature) => feature.name)

function seed(options: Partial<Parameters<typeof seedDocumentFeatures>[0]> = {}) {
  return seedDocumentFeatures({
    inspectors: [],
    fieldActions: [],
    declared: [],
    contributed: [],
    ...options,
  })
}

describe('seedDocumentFeatures', () => {
  it('seeds the built-ins, then the contributed features, then one feature per inspector, then one per field action', () => {
    const seeded = seed({
      inspectors: [validationInspector, historyInspector],
      fieldActions: [copyField, pasteField],
      contributed: [SPLIT_PANE, CLOSE_PANE],
    })

    expect(seeded.map((feature) => feature.name)).toEqual([
      ...BUILT_IN_NAMES,
      'splitPane',
      'closePane',
      'sanity/structure/validation',
      'sanity/structure/history',
      'copyField',
      'pasteField',
    ])
  })

  it('names an auto feature by its registration name', () => {
    const [inspectorFeature] = seed({inspectors: [assistInspector]}).slice(-1)
    const [fieldActionFeature] = seed({fieldActions: [assistActions]}).slice(-1)

    expect(inspectorFeature).toEqual({name: 'ai-assistance', inspector: assistInspector})
    expect(fieldActionFeature).toEqual({
      name: 'sanity-assist-actions',
      fieldAction: assistActions,
    })
  })

  it('places a declared owner instead of an auto feature for a registration it carries', () => {
    const seeded = seed({
      inspectors: [validationInspector],
      declared: [validationFeature],
    })

    expect(seeded).toContain(validationFeature)
    expect(seeded.map((feature) => feature.name)).toEqual([...BUILT_IN_NAMES, 'validation'])
  })

  it('places a declared feature carrying both an inspector and a field action once, at the inspector position', () => {
    const seeded = seed({
      inspectors: [assistInspector, historyInspector],
      fieldActions: [copyField, assistActions],
      declared: [assistFeature],
    })

    expect(seeded.map((feature) => feature.name)).toEqual([
      ...BUILT_IN_NAMES,
      'ai-assistance',
      'sanity/structure/history',
      'copyField',
    ])
    expect(seeded.filter((feature) => feature === assistFeature)).toHaveLength(1)
  })

  it('keeps the first declaration of a registration declared twice', () => {
    const second: DocumentFeature = {name: 'validationAgain', inspector: validationInspector}
    const seeded = seed({
      inspectors: [validationInspector],
      declared: [validationFeature, second],
    })

    expect(seeded).toContain(validationFeature)
    expect(seeded).not.toContain(second)
  })
})

describe('stripToRegistered', () => {
  const registrations = {inspectors: [validationInspector], fieldActions: [copyField]}

  it('returns the feature untouched when every registration it carries survived', () => {
    expect(stripToRegistered(validationFeature, registrations)).toBe(validationFeature)
  })

  it('strips an inspector a flat resolver removed and keeps the rest of the feature', () => {
    const feature: DocumentFeature = {
      name: 'ai-assistance',
      inspector: assistInspector,
      fieldAction: copyField,
    }

    expect(stripToRegistered(feature, registrations)).toEqual({
      name: 'ai-assistance',
      inspector: undefined,
      fieldAction: copyField,
    })
  })

  it('drops the feature when stripping leaves it with nothing to bring', () => {
    expect(stripToRegistered(assistFeature, registrations)).toBeUndefined()
  })

  it('keeps a stripped feature that still has a toolbar entry', () => {
    const feature: DocumentFeature = {
      name: 'ai-assistance',
      inspector: assistInspector,
      toolbar: HEADER_ENTRY,
    }

    expect(stripToRegistered(feature, registrations)).toEqual({
      name: 'ai-assistance',
      inspector: undefined,
      fieldAction: undefined,
      toolbar: HEADER_ENTRY,
    })
  })
})

describe('finalizeDocumentFeatures', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('projects inspectors and field actions in feature order, not registration order', () => {
    const {inspectors, fieldActions} = finalizeDocumentFeatures([
      {name: 'ai-assistance', inspector: assistInspector, fieldAction: assistActions},
      historyFeature,
      {name: 'copyField', fieldAction: copyField},
    ])

    expect(inspectors).toEqual([assistInspector, historyInspector])
    expect(fieldActions).toEqual([assistActions, copyField])
  })

  it('removes a feature inspector, field action and toolbar entry together', () => {
    const everything: DocumentFeature = {
      name: 'ai-assistance',
      inspector: assistInspector,
      fieldAction: assistActions,
      toolbar: HEADER_ENTRY,
    }
    const kept = finalizeDocumentFeatures([everything, historyFeature])
    const removed = finalizeDocumentFeatures([historyFeature])

    expect(kept.inspectors).toContain(assistInspector)
    expect(kept.fieldActions).toContain(assistActions)
    expect(kept.header).toContain(everything)

    expect(removed.byName.has('ai-assistance')).toBe(false)
    expect(removed.inspectors).not.toContain(assistInspector)
    expect(removed.fieldActions).not.toContain(assistActions)
    expect(removed.header).toEqual([])
  })

  it('leaves every projection empty when the chain resolved nothing', () => {
    const resolved = finalizeDocumentFeatures([])

    expect(resolved.features).toEqual([])
    expect([...resolved.byName.keys()]).toEqual([])
    expect(resolved.inspectors).toEqual([])
    expect(resolved.fieldActions).toEqual([])
    expect(resolved.header).toEqual([])
    expect(resolved.menu).toEqual([])
  })

  it('collapses a duplicate name to the last one, in the last position, and warns', () => {
    const later: DocumentFeature = {name: 'splitPane', toolbar: OTHER_HEADER_ENTRY}
    const {byName, header} = finalizeDocumentFeatures([SPLIT_PANE, FOCUS_MODE, later])

    expect(byName.get('splitPane')).toBe(later)
    expect(header.map((feature) => feature.name)).toEqual(['focusMode', 'splitPane'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`splitPane`'))
  })

  it('partitions toolbar entries by placement and never puts a built-in in either', () => {
    const {header, menu} = finalizeDocumentFeatures([
      ...SANITY_DEFINED_FEATURES,
      SPLIT_PANE,
      CLOSE_PANE,
      validationFeature,
    ])

    expect(header).toEqual([SPLIT_PANE])
    expect(menu).toEqual([CLOSE_PANE])
  })
})

describe('the document.features chain', () => {
  function resolveChain({
    config,
    inspectors = [],
    fieldActions = [],
    contributed = [],
  }: {
    config: PluginOptions
    inspectors?: DocumentInspector[]
    fieldActions?: DocumentFieldAction[]
    contributed?: DocumentFeature[]
  }) {
    const declared = flattenConfig(config, []).flatMap(({config: node}) =>
      Array.isArray(node.document?.features) ? node.document.features : [],
    )

    const chained = resolveConfigProperty({
      config,
      context: {schemaType: 'species'} as never,
      initialValue: seedDocumentFeatures({inspectors, fieldActions, declared, contributed}),
      propertyName: 'document.features',
      reducer: createDocumentFeaturesReducer({inspectors, fieldActions}),
    })

    return {chained, ...finalizeDocumentFeatures(chained)}
  }

  it('appends a declared toolbar-only feature at its node and never twice', () => {
    const wikipedia: DocumentFeature = {name: 'speciesWikipedia', toolbar: HEADER_ENTRY}

    const {header, chained} = resolveChain({
      config: {
        name: 'root',
        plugins: [
          {name: 'species-plugin', document: {features: [wikipedia]}},
          {name: 'species-plugin-again', document: {features: [wikipedia]}},
        ],
      },
      contributed: [SPLIT_PANE],
    })

    expect(header).toEqual([SPLIT_PANE, wikipedia])
    expect(chained.filter((feature) => feature === wikipedia)).toHaveLength(1)
  })

  it('does not resurrect a declared inspector that a flat resolver removed', () => {
    const {inspectors, byName, header} = resolveChain({
      config: {
        name: 'root',
        document: {
          features: [
            assistFeature,
            {name: 'validation', inspector: validationInspector, toolbar: HEADER_ENTRY},
          ],
        },
      },
      inspectors: [],
      fieldActions: [],
    })

    expect(inspectors).toEqual([])
    expect(byName.has('ai-assistance')).toBe(false)
    expect(header.map((feature) => feature.name)).toEqual(['validation'])
  })

  it('projects inspectors and field actions in features order after a resolver reorders them', () => {
    const {inspectors, fieldActions} = resolveChain({
      config: {
        name: 'root',
        document: {features: (prev) => [...prev].reverse()},
      },
      inspectors: [validationInspector, historyInspector],
      fieldActions: [copyField, pasteField],
    })

    expect(inspectors).toEqual([historyInspector, validationInspector])
    expect(fieldActions).toEqual([pasteField, copyField])
  })

  it('leaves every projection empty when the root resolver returns nothing', () => {
    const resolved = resolveChain({
      config: {
        name: 'root',
        document: {features: () => []},
      },
      inspectors: [validationInspector],
      fieldActions: [copyField],
      contributed: [SPLIT_PANE],
    })

    expect(resolved.features).toEqual([])
    expect([...resolved.byName.keys()]).toEqual([])
    expect(resolved.inspectors).toEqual([])
    expect(resolved.fieldActions).toEqual([])
    expect(resolved.header).toEqual([])
    expect(resolved.menu).toEqual([])
  })
})
