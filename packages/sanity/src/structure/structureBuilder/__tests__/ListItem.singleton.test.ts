import {type SchemaPluginOptions} from 'sanity'
import {describe, expect, it} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {createStructureBuilder} from '../createStructureBuilder'
import {SerializeError} from '../SerializeError'
import {type DocumentNode} from '../StructureNodes'
import {type StructureBuilder} from '../types'

function SchemaIcon() {
  return null
}

function DefinitionIcon() {
  return null
}

const mockSchema: SchemaPluginOptions = {
  name: 'mockSchema',
  types: [
    {
      name: 'siteSettings',
      title: 'Site Settings',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
    {
      name: 'article',
      title: 'Article',
      type: 'document',
      icon: SchemaIcon,
      fields: [{name: 'title', type: 'string'}],
    },
  ],
}

async function createBuilder(): Promise<StructureBuilder> {
  const source = await getMockSource({
    config: {
      schema: mockSchema,
      document: {
        singletons: [
          // String-shorthand shape: id === documentId === schemaType.
          'siteSettings',
          // Shared schema type, relying on generated defaults.
          {id: 'featuredArticle', documentId: 'featuredArticle', schemaType: 'article'},
          // Shared schema type with explicit display metadata.
          {
            id: 'editorsPick',
            documentId: 'editorsPick',
            schemaType: 'article',
            title: "Editor's Pick",
            icon: DefinitionIcon,
          },
        ],
      },
    },
  })
  return createStructureBuilder({source, perspectiveStack: []})
}

describe('ListItemBuilder.singleton()', () => {
  it('defaults id, title, schema type, and child from the definition', async () => {
    const S = await createBuilder()
    const item = S.listItem().singleton('siteSettings').serialize()

    expect(item.id).toBe('siteSettings')
    // Definition id and schema type name are identical, so the schema type
    // title is the natural label.
    expect(item.title).toBe('Site Settings')
    expect(item.schemaType).toBe(S.context.schema.get('siteSettings'))

    const child = item.child as DocumentNode
    expect(child.type).toBe('document')
    expect(child.options.id).toBe('siteSettings')
    expect(child.options.type).toBe('siteSettings')
  })

  it('start-cases the definition id when the schema type is shared', async () => {
    const S = await createBuilder()
    const item = S.listItem().singleton('featuredArticle').serialize()

    // The schema type title ("Article") would collide across singletons
    // sharing the type, so the definition id is used instead.
    expect(item.title).toBe('Featured Article')

    const child = item.child as DocumentNode
    expect(child.options.id).toBe('featuredArticle')
    expect(child.options.type).toBe('article')
  })

  it('uses the definition title and icon when provided', async () => {
    const S = await createBuilder()
    const item = S.listItem().singleton('editorsPick').serialize()

    expect(item.title).toBe("Editor's Pick")
    expect(item.icon).toBe(DefinitionIcon)
  })

  it('falls back to the schema type icon when the definition has none', async () => {
    const S = await createBuilder()
    const item = S.listItem().singleton('featuredArticle').serialize()

    expect(item.icon).toBe(SchemaIcon)
  })

  it('respects overrides chained after the singleton call', async () => {
    const S = await createBuilder()
    const item = S.listItem().singleton('siteSettings').title('Custom Title').serialize()

    expect(item.title).toBe('Custom Title')
    expect(item.id).toBe('siteSettings')
  })

  it('respects values set before the singleton call', async () => {
    const S = await createBuilder()
    const item = S.listItem()
      .id('customId')
      .title('Custom Title')
      .singleton('siteSettings')
      .serialize()

    expect(item.id).toBe('customId')
    expect(item.title).toBe('Custom Title')
    expect((item.child as DocumentNode).options.id).toBe('siteSettings')
  })

  it('throws immediately when given an unknown singleton definition id', async () => {
    const S = await createBuilder()
    expect(() => S.listItem().singleton('typo')).toThrow(SerializeError)
    expect(() => S.listItem().singleton('typo')).toThrow(/No singleton with id "typo" found/)
  })
})
