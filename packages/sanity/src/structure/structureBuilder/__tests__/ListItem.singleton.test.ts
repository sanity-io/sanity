import {type SchemaPluginOptions} from 'sanity'
import {describe, expect, it} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {createStructureBuilder} from '../createStructureBuilder'
import {type DocumentListItem} from '../DocumentListItem'
import {type ListItemBuilder} from '../ListItem'
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
    {
      // No explicit title: the compiled schema type start-cases its name.
      name: 'pageSettings',
      type: 'document',
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
          // Schema type without an explicit title.
          {id: 'pages', documentId: 'pages', schemaType: 'pageSettings'},
          // Definition id deliberately differing from the document id.
          {id: 'settingsSingleton', documentId: 'settingsDocument', schemaType: 'siteSettings'},
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
    expect(item.title).toBe('Site Settings')
    expect(item.schemaType).toBe(S.context.schema.get('siteSettings'))

    const child = item.child as DocumentNode
    expect(child.type).toBe('document')
    expect(child.options.id).toBe('siteSettings')
    expect(child.options.type).toBe('siteSettings')
  })

  it('falls back to the schema type title when the definition has none', async () => {
    const S = await createBuilder()
    const item = S.listItem().singleton('featuredArticle').serialize()

    // Singletons sharing a schema type share this title by design; only the
    // list item id has to be unique.
    expect(item.title).toBe('Article')
    expect(item.id).toBe('featuredArticle')

    const child = item.child as DocumentNode
    expect(child.options.id).toBe('featuredArticle')
    expect(child.options.type).toBe('article')
  })

  it('start-cases the schema type name when the schema type has no title', async () => {
    const S = await createBuilder()
    const item = S.listItem().singleton('pages').serialize()

    expect(item.title).toBe('Page Settings')
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

  it('keeps using the definition id when it differs from the document id', async () => {
    const S = await createBuilder()
    const item = S.listItem().singleton('settingsSingleton').serialize()

    // A plain list item renders a static title, so nothing derives a document
    // id from its id; the definition id (unique by construction) is right.
    expect(item.id).toBe('settingsSingleton')
    expect((item.child as DocumentNode).options.id).toBe('settingsDocument')
  })
})

/**
 * Every chainable `ListItemBuilder` method declares `ListItemBuilder`, so a
 * `S.documentListItem()` chain erodes the declared subclass type
 * (pre-existing). The runtime builder is still a `DocumentListItemBuilder`,
 * whose `serialize` adds `_id`.
 */
function serializeDocumentListItem(builder: ListItemBuilder): DocumentListItem {
  return builder.serialize() as DocumentListItem
}

describe('DocumentListItemBuilder.singleton()', () => {
  it('defaults `_id` to the document id, not the definition id', async () => {
    const S = await createBuilder()
    const item = serializeDocumentListItem(S.documentListItem().singleton('settingsSingleton'))

    // `_id` is the document a document list item previews, so defaulting to
    // the definition id would preview a document that does not exist.
    expect(item._id).toBe('settingsDocument')
    expect(item.id).toBe('settingsDocument')
    expect((item.child as DocumentNode).options.id).toBe('settingsDocument')
  })

  it('is unaffected when the definition id and document id are identical', async () => {
    const S = await createBuilder()
    const item = serializeDocumentListItem(S.documentListItem().singleton('siteSettings'))

    expect(item._id).toBe('siteSettings')
    expect(item.schemaType).toBe(S.context.schema.get('siteSettings'))
  })

  it('respects an explicitly set id', async () => {
    const S = await createBuilder()
    const item = serializeDocumentListItem(
      S.documentListItem().id('customId').singleton('settingsSingleton'),
    )

    expect(item._id).toBe('customId')
    // The child still targets the singleton's document.
    expect((item.child as DocumentNode).options.id).toBe('settingsDocument')
  })

  it('inherits the definition title and icon', async () => {
    const S = await createBuilder()
    const item = S.documentListItem().singleton('editorsPick').serialize()

    expect(item.title).toBe("Editor's Pick")
    expect(item.icon).toBe(DefinitionIcon)
  })
})
