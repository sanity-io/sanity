import {createClient} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {createMockAuthStore} from '../../store/authStore/createMockAuthStore'
import {type DocumentFeature} from '../document/features'
import {type DocumentFieldAction} from '../document/fieldActions/types'
import {type DocumentInspector} from '../document/inspector'
import {createSourceFromConfig} from '../resolveConfig'
import {type PluginOptions, type SingleWorkspace, type Source} from '../types'

function Panel() {
  return null
}

const validationInspector: DocumentInspector = {
  name: 'sanity/structure/validation',
  component: Panel,
}
const historyInspector: DocumentInspector = {name: 'sanity/structure/history', component: Panel}
const incomingReferencesInspector: DocumentInspector = {
  name: 'sanity/structure/incoming-references',
  component: Panel,
}
const pluginInspector: DocumentInspector = {name: 'plugin/inspector', component: Panel}
const assistInspector: DocumentInspector = {name: 'ai-assistance', component: Panel}

const assistActions: DocumentFieldAction = {
  name: 'sanity-assist-actions',
  useAction: () => ({}) as never,
}
const pluginFieldAction: DocumentFieldAction = {
  name: 'plugin/fieldAction',
  useAction: () => ({}) as never,
}

/** Stands in for `structureTool()`, which `src/core` may not import. */
const structureShapedPlugin: PluginOptions = {
  name: 'structure-shaped',
  document: {
    features: [
      {name: 'validation', inspector: validationInspector},
      {name: 'history', inspector: historyInspector},
      {name: 'incomingReferences', inspector: incomingReferencesInspector},
    ],
  },
}

const inspectorPlugin: PluginOptions = {
  name: 'inspector-plugin',
  document: {inspectors: [pluginInspector]},
}

const assistShapedPlugin: PluginOptions = {
  name: 'assist-shaped',
  document: {
    inspectors: (prev, {documentType}) =>
      documentType === 'author' ? [...prev, assistInspector] : prev,
    unstable_fieldActions: (prev, {documentType}) =>
      documentType === 'author' ? [...prev, assistActions] : prev,
  },
}

function createSource(overrides: Partial<SingleWorkspace>): Promise<Source> {
  const projectId = `features-${Math.random().toString(36).slice(2)}`
  const dataset = 'test'

  return createSourceFromConfig({
    name: 'test',
    basePath: '/',
    projectId,
    dataset,
    schema: {
      types: [
        {name: 'author', type: 'document', fields: [{name: 'title', type: 'string'}]},
        {name: 'book', type: 'document', fields: [{name: 'title', type: 'string'}]},
      ],
    },
    auth: createMockAuthStore({
      client: createClient({projectId, dataset, apiVersion: '2021-06-07', useCdn: false}),
      currentUser: null,
    }),
    ...overrides,
  })
}

function names(features: readonly DocumentFeature[]): string[] {
  return features.map((feature) => feature.name)
}

describe('Source.document.features', () => {
  it('keeps the inspector order a declaring plugin and a flat plugin produce today', async () => {
    const source = await createSource({plugins: [structureShapedPlugin, inspectorPlugin]})

    const {inspectors} = source.document.features({documentId: 'author-1', schemaType: 'author'})
    const flat = source.document.inspectors({documentId: 'author-1', documentType: 'author'})

    expect(inspectors.map((inspector) => inspector.name).slice(0, 4)).toEqual([
      'sanity/structure/validation',
      'sanity/structure/history',
      'sanity/structure/incoming-references',
      'plugin/inspector',
    ])
    expect(inspectors).toEqual(flat)
  })

  it('auto-names one feature per registration an assist-shaped plugin adds, for the type it enables only', async () => {
    const source = await createSource({plugins: [assistShapedPlugin]})

    const enabled = source.document.features({documentId: 'author-1', schemaType: 'author'})
    const disabled = source.document.features({documentId: 'book-1', schemaType: 'book'})

    expect(enabled.byName.get('ai-assistance')).toEqual({
      name: 'ai-assistance',
      inspector: assistInspector,
    })
    expect(enabled.byName.get('sanity-assist-actions')).toEqual({
      name: 'sanity-assist-actions',
      fieldAction: assistActions,
    })

    expect(disabled.byName.has('ai-assistance')).toBe(false)
    expect(disabled.byName.has('sanity-assist-actions')).toBe(false)
  })

  it('lets a root features filter remove a plugin flat-registered inspector and field action', async () => {
    const ASSIST = new Set(['ai-assistance', 'sanity-assist-actions'])
    const source = await createSource({
      plugins: [assistShapedPlugin],
      document: {
        features: (prev, {schemaType}) =>
          schemaType === 'author'
            ? prev.filter((feature) => ASSIST.has(feature.name) === false)
            : prev,
      },
    })

    const {byName, inspectors, fieldActions} = source.document.features({
      documentId: 'author-1',
      schemaType: 'author',
    })

    expect(byName.has('ai-assistance')).toBe(false)
    expect(byName.has('sanity-assist-actions')).toBe(false)
    expect(inspectors).not.toContain(assistInspector)
    expect(fieldActions).not.toContain(assistActions)
  })

  it('shows the root features function the root own flat additions', async () => {
    let seen: string[] = []

    const source = await createSource({
      document: {
        inspectors: [pluginInspector],
        unstable_fieldActions: [pluginFieldAction],
        features: (prev) => {
          seen = names(prev)
          return prev
        },
      },
    })

    source.document.features({documentId: 'author-1', schemaType: 'author'})

    expect(seen).toContain('plugin/inspector')
    expect(seen).toContain('plugin/fieldAction')
  })
})
