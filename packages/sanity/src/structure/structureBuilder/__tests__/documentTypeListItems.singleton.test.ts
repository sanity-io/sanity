import {type SchemaPluginOptions, type UnresolvedSingletonDefinition} from 'sanity'
import {describe, expect, it} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {createStructureBuilder} from '../createStructureBuilder'
import {type List} from '../List'
import {type ListItem} from '../ListItem'
import {type DocumentNode} from '../StructureNodes'
import {type StructureBuilder} from '../types'

const mockSchema: SchemaPluginOptions = {
  name: 'mockSchema',
  types: [
    {
      name: 'settings',
      title: 'Settings',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
    {
      name: 'article',
      title: 'Article',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
  ],
}

async function createBuilder(
  singletons: UnresolvedSingletonDefinition[],
  schema: SchemaPluginOptions = mockSchema,
): Promise<StructureBuilder> {
  const source = await getMockSource({
    config: {
      schema,
      document: {singletons},
    },
  })
  return createStructureBuilder({source, perspectiveStack: []})
}

function MockIcon() {
  return null
}

/**
 * The ids of a list's items, minus Sanity's own bundled document types. The
 * mock schema pulls those in, and not all of them are filtered from default
 * lists (`BUNDLED_DOC_TYPES` misses `sanity.videoAsset`), which is incidental
 * to what these tests assert.
 */
function contentItemIds(list: List): string[] {
  return list.items.map((item) => item.id).filter((id) => !id.startsWith('sanity.'))
}

describe('default content list filtering', () => {
  it('skips schema types used by a singleton definition', async () => {
    const S = await createBuilder(['settings'])
    const ids = S.documentTypeListItems().map((item) => item.getId())
    expect(ids).toContain('article')
    expect(ids).not.toContain('settings')
  })

  it('skips shared schema types when any singleton claims them', async () => {
    const S = await createBuilder([
      'settings',
      {id: 'featuredArticle', documentId: 'featuredArticle', schemaType: 'article'},
    ])
    const ids = S.documentTypeListItems().map((item) => item.getId())
    expect(ids).not.toContain('article')
    expect(ids).not.toContain('settings')
  })

  it('filters nothing when no singletons are configured', async () => {
    const S = await createBuilder([])
    const ids = S.documentTypeListItems().map((item) => item.getId())
    expect(ids).toContain('article')
    expect(ids).toContain('settings')
  })
})

describe('default structure', () => {
  it('appends a list item per singleton, after the document type list items', async () => {
    const S = await createBuilder(['settings'])
    const list = S.defaults().serialize()

    // `settings` is filtered from the document type lists and surfaced as its
    // own top-level item instead.
    expect(contentItemIds(list)).toEqual(['article', 'settings'])
  })

  it('preserves registration order within the appended singletons', async () => {
    const S = await createBuilder([
      {id: 'featuredArticle', documentId: 'featuredArticle', schemaType: 'article'},
      'settings',
    ])
    const list = S.defaults().serialize()

    // Both schema types are claimed, so no document type list items remain.
    expect(contentItemIds(list)).toEqual(['featuredArticle', 'settings'])
  })

  it('points each singleton item at the singleton document', async () => {
    const S = await createBuilder([
      {id: 'settingsSingleton', documentId: 'settingsDocument', schemaType: 'settings'},
    ])
    const list = S.defaults().serialize()

    const item = list.items.find(({id}) => id === 'settingsSingleton') as ListItem
    const child = item.child as DocumentNode
    expect(child.type).toBe('document')
    expect(child.options.id).toBe('settingsDocument')
    expect(child.options.type).toBe('settings')
  })

  it('adds nothing when no singletons are registered', async () => {
    const S = await createBuilder([])
    const list = S.defaults().serialize()

    expect(contentItemIds(list)).toEqual(['settings', 'article'])
  })

  it('shows icons when only a singleton definition provides one', async () => {
    // No schema type in `mockSchema` has an icon, so the definition's icon is
    // the only reason to enable icons for the list.
    const S = await createBuilder([
      {id: 'settings', documentId: 'settings', schemaType: 'settings', icon: MockIcon},
    ])
    const list = S.defaults().serialize()

    expect(list.displayOptions?.showIcons).toBe(true)
  })

  it('leaves icons off when neither the definitions nor the schema types have any', async () => {
    const S = await createBuilder(['settings'])
    const list = S.defaults().serialize()

    expect(list.displayOptions?.showIcons).toBe(false)
  })

  it('inherits the schema type icon when the definition has none', async () => {
    const S = await createBuilder(['settings'], {
      ...mockSchema,
      types: [
        {
          name: 'settings',
          title: 'Settings',
          type: 'document',
          icon: MockIcon,
          fields: [{name: 'title', type: 'string'}],
        },
      ],
    })
    const list = S.defaults().serialize()

    const item = list.items.find(({id}) => id === 'settings') as ListItem
    expect(item.icon).toBe(MockIcon)
    expect(list.displayOptions?.showIcons).toBe(true)
  })
})

describe('explicit document type lists', () => {
  it('S.documentTypeList() is never filtered, even for singleton schema types', async () => {
    // Explicit usage always wins: a document type list over a shared schema
    // type legitimately lists the non-singleton documents (and the singleton
    // document itself), so no filtering or warning applies.
    const S = await createBuilder(['settings'])
    expect(() => S.documentTypeList('settings')).not.toThrow()
    const list = S.documentTypeList('settings').serialize()
    expect(list.schemaTypeName).toBe('settings')
  })

  it('S.documentTypeListItem() is never filtered either', async () => {
    const S = await createBuilder(['settings'])
    const item = S.documentTypeListItem('settings').serialize()
    expect(item.id).toBe('settings')
  })
})
