import {defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../../core/schema'
import {createStructureBuilder} from '../createStructureBuilder'
import {SerializeError} from '../SerializeError'
import {type StructureBuilder} from '../types'

function createBuilder(): StructureBuilder {
  const schema = createSchema({
    name: 'default',
    types: [
      defineType({
        name: 'settings',
        type: 'document',
        singleton: {documentId: 'settings'},
        fields: [{name: 'title', type: 'string'}],
      }),
      defineType({
        name: 'navigation',
        type: 'document',
        singleton: {documentId: 'nav'},
        fields: [{name: 'links', type: 'string'}],
      }),
      defineType({
        name: 'article',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      }),
    ],
  })

  const source = {
    schema,
    i18n: {t: (key: string) => key},
  } as unknown as Parameters<typeof createStructureBuilder>[0]['source']

  return createStructureBuilder({source, perspectiveStack: []})
}

describe('ListBuilder.singletons()', () => {
  it('produces one list item per singleton schema type name', () => {
    const S = createBuilder()
    const list = S.list()
      .id('singletons')
      .title('Singletons')
      .singletons(['settings', 'navigation'])
      .serialize()
    expect(list.items.map((item) => item.id)).toEqual(['settings', 'navigation'])
  })

  it('appends to existing items rather than replacing them', () => {
    const S = createBuilder()
    const list = S.list()
      .id('mixed')
      .title('Mixed')
      .items([S.listItem().id('content').title('Content')])
      .singletons(['settings'])
      .serialize()
    expect(list.items.map((item) => item.id)).toEqual(['content', 'settings'])
  })

  it('throws if any name in the array is not a singleton schema type', () => {
    const S = createBuilder()
    expect(() => S.list().id('mixed').title('Mixed').singletons(['settings', 'article'])).toThrow(
      SerializeError,
    )
    expect(() => S.list().id('mixed').title('Mixed').singletons(['settings', 'article'])).toThrow(
      /is not a singleton/,
    )
  })
})
