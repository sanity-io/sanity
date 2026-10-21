import {
  type ConfigContext,
  createSchema,
  type DocumentBadgeComponent,
  type DocumentBadgesContext,
  type DocumentInspector,
  type DocumentInspectorContext,
  type LocaleSource,
} from 'sanity'
import {describe, expect, it} from 'vitest'

import {defaultLocale} from '../core/i18n/locales'
import {useLiveEditBadge} from './documentBadges/LiveEditBadge'
import {useSingletonBadge} from './documentBadges/SingletonBadge'
import {documentGroupInspector} from './panes/document/inspectors/documentGroup'
import {structureTool} from './structureTool'

const stubContext: ConfigContext = {
  projectId: 'ppsg7ml5',
  dataset: 'production',
  schema: createSchema({name: 'test', types: []}),
  currentUser: null,
  getClient: () => {
    throw new Error('`getClient` is not mocked.')
  },
  i18n: {
    currentLocale: defaultLocale,
    locales: [defaultLocale],
    loadNamespaces: () => Promise.resolve(),
    t: ((key: string) => key) as unknown as LocaleSource['t'],
  },
}

const singletonContext: DocumentBadgesContext = {
  ...stubContext,
  schemaType: 'settings',
  documentId: 'settingsDocument',
  singleton: 'settingsSingleton',
}

const regularContext: DocumentBadgesContext = {
  ...stubContext,
  schemaType: 'article',
  documentId: 'someArticle',
}

const pluginBadge: DocumentBadgeComponent = () => null

describe('badges', () => {
  it('adds the singleton badge for singleton documents', () => {
    expect(resolveBadges([], singletonContext)).toEqual([useLiveEditBadge, useSingletonBadge])
  })

  it('omits the singleton badge for documents that are not singletons', () => {
    expect(resolveBadges([], regularContext)).toEqual([useLiveEditBadge])
  })

  it('preserves badges added by other plugins', () => {
    expect(resolveBadges([pluginBadge], singletonContext)).toEqual([
      pluginBadge,
      useLiveEditBadge,
      useSingletonBadge,
    ])
  })

  it('adds each badge exactly once when several structure tools are configured', () => {
    const firstTool = resolveBadges([], singletonContext)
    const secondTool = resolveBadges(firstTool, singletonContext)

    expect(secondTool).toEqual(firstTool)
    expect(secondTool.filter((badge) => badge === useSingletonBadge)).toHaveLength(1)
    expect(secondTool.filter((badge) => badge === useLiveEditBadge)).toHaveLength(1)
  })
})

const inspectorContext: DocumentInspectorContext = {
  ...stubContext,
  documentType: 'article',
  documentId: 'someArticle',
}

const documentGroupInventoryContext: DocumentInspectorContext = {
  ...inspectorContext,
  beta: {documentGroupInventory: {enabled: true}},
}

const pluginInspector: DocumentInspector = {
  name: 'test/plugin-inspector',
  component: () => null,
}

describe('inspectors', () => {
  it('omits the document group inspector when the document group inventory is disabled', () => {
    expect(resolveInspectors([], inspectorContext)).not.toContain(documentGroupInspector)
    expect(
      resolveInspectors([], {
        ...inspectorContext,
        beta: {documentGroupInventory: {enabled: false}},
      }),
    ).not.toContain(documentGroupInspector)
  })

  it('adds the document group inspector when the document group inventory is enabled', () => {
    expect(resolveInspectors([], documentGroupInventoryContext)).toContain(documentGroupInspector)
  })

  it('preserves inspectors added by other plugins', () => {
    expect(resolveInspectors([pluginInspector], documentGroupInventoryContext)[0]).toBe(
      pluginInspector,
    )
  })

  it('adds the document group inspector exactly once when several structure tools are configured', () => {
    const firstTool = resolveInspectors([], documentGroupInventoryContext)
    const secondTool = resolveInspectors(firstTool, documentGroupInventoryContext)

    expect(secondTool).toEqual(firstTool)
    expect(secondTool.filter((inspector) => inspector === documentGroupInspector)).toHaveLength(1)
  })
})

function resolveInspectors(
  prevInspectors: DocumentInspector[],
  context: DocumentInspectorContext,
): DocumentInspector[] {
  const inspectors = structureTool().document?.inspectors

  if (typeof inspectors !== 'function') {
    throw new TypeError('Expected `structureTool` to declare `document.inspectors` as a resolver')
  }

  return inspectors(prevInspectors, context)
}

function resolveBadges(
  prevBadges: DocumentBadgeComponent[],
  context: DocumentBadgesContext,
): DocumentBadgeComponent[] {
  const badges = structureTool().document?.badges

  if (typeof badges !== 'function') {
    throw new TypeError('Expected `structureTool` to declare `document.badges` as a resolver')
  }

  return badges(prevBadges, context)
}
