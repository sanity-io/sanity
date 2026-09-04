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
