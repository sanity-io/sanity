import {type SchemaPluginOptions, type UnresolvedSingletonDefinition} from 'sanity'
import {describe, expect, it} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {createStructureBuilder} from '../createStructureBuilder'
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
): Promise<StructureBuilder> {
  const source = await getMockSource({
    config: {
      schema: mockSchema,
      document: {singletons},
    },
  })
  return createStructureBuilder({source, perspectiveStack: []})
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
