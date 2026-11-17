import {type SchemaPluginOptions} from 'sanity'
import {describe, expect, it} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {createStructureBuilder} from '../createStructureBuilder'
import {type ListItem} from '../ListItem'
import {SerializeError} from '../SerializeError'
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
      name: 'navigation',
      title: 'Navigation',
      type: 'document',
      fields: [{name: 'links', type: 'string'}],
    },
  ],
}

async function createBuilder(): Promise<StructureBuilder> {
  const source = await getMockSource({
    config: {
      schema: mockSchema,
      document: {
        singletons: ['settings', 'navigation'],
      },
    },
  })
  return createStructureBuilder({source, perspectiveStack: []})
}

describe('ListBuilder.singletons()', () => {
  it('produces one list item per singleton definition id', async () => {
    const S = await createBuilder()
    const list = S.list()
      .id('singletons')
      .title('Singletons')
      .singletons(['settings', 'navigation'])
      .serialize()

    expect(list.items.map((item) => item.id)).toEqual(['settings', 'navigation'])

    const [settingsItem] = list.items as ListItem[]
    const child = settingsItem.child as DocumentNode
    expect(child.type).toBe('document')
    expect(child.options.id).toBe('settings')
    expect(child.options.type).toBe('settings')
  })

  it('appends to existing items rather than replacing them', async () => {
    const S = await createBuilder()
    const list = S.list()
      .id('mixed')
      .title('Mixed')
      .items([S.listItem().id('content').title('Content')])
      .singletons(['settings'])
      .serialize()

    expect(list.items.map((item) => item.id)).toEqual(['content', 'settings'])
  })

  it('keeps appending across repeated calls', async () => {
    const S = await createBuilder()
    const list = S.list()
      .id('repeated')
      .title('Repeated')
      .singletons(['settings'])
      .singletons(['navigation'])
      .serialize()

    expect(list.items.map((item) => item.id)).toEqual(['settings', 'navigation'])
  })

  it('throws if any id in the array is not a registered singleton definition', async () => {
    const S = await createBuilder()
    expect(() => S.list().id('broken').title('Broken').singletons(['settings', 'typo'])).toThrow(
      SerializeError,
    )
    expect(() => S.list().id('broken').title('Broken').singletons(['settings', 'typo'])).toThrow(
      /No singleton with id "typo" found/,
    )
  })
})

describe('ListBuilder.singletons() without arguments', () => {
  it('appends every registered singleton, in registration order', async () => {
    const S = await createBuilder()
    const list = S.list().id('singletons').title('Singletons').singletons().serialize()

    expect(list.items.map((item) => item.id)).toEqual(['settings', 'navigation'])
  })

  it('appends to existing items rather than replacing them', async () => {
    const S = await createBuilder()
    const list = S.list()
      .id('mixed')
      .title('Mixed')
      .items([S.listItem().id('content').title('Content')])
      .singletons()
      .serialize()

    expect(list.items.map((item) => item.id)).toEqual(['content', 'settings', 'navigation'])
  })

  it('treats an explicit empty array as "none", not "all"', async () => {
    const S = await createBuilder()
    const list = S.list()
      .id('none')
      .title('None')
      .items([S.listItem().id('content').title('Content')])
      .singletons([])
      .serialize()

    expect(list.items.map((item) => item.id)).toEqual(['content'])
  })

  it('resolves to an empty list when no singletons are registered', async () => {
    const source = await getMockSource({config: {schema: mockSchema}})
    const S = createStructureBuilder({source, perspectiveStack: []})

    const list = S.list().id('singletons').title('Singletons').singletons().serialize()

    expect(list.items).toEqual([])
  })

  it('throws a singleton-aware duplicate id error when a singleton is already in items()', async () => {
    const S = await createBuilder()
    const list = S.list()
      .id('duplicated')
      .title('Duplicated')
      .items([S.listItem().singleton('settings')])
      .singletons()

    expect(() => list.serialize()).toThrow(SerializeError)
    expect(() => list.serialize()).toThrow(/List items with same ID found \(settings\)/)
    expect(() => list.serialize()).toThrow(/singleton definition ids/)
  })
})
