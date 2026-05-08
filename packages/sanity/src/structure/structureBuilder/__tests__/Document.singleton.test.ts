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
        name: 'article',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      }),
    ],
  })

  // Minimal Source stand-in. We only need `schema` + `i18n.t` to flow through
  // the structure builder for these tests.
  const source = {
    schema,
    i18n: {t: (key: string) => key},
  } as unknown as Parameters<typeof createStructureBuilder>[0]['source']

  return createStructureBuilder({source, perspectiveStack: []})
}

describe('DocumentBuilder.singleton()', () => {
  it('sets schemaType and documentId from the schema definition', () => {
    const S = createBuilder()
    const node = S.document().singleton('settings').serialize()
    expect(node.options.id).toBe('settings')
    expect(node.options.type).toBe('settings')
  })

  it('throws immediately when given an unknown schema type', () => {
    const S = createBuilder()
    expect(() => S.document().singleton('typo')).toThrow(SerializeError)
    expect(() => S.document().singleton('typo')).toThrow(/not find type "typo"/)
  })

  it('throws immediately when given a non-singleton schema type', () => {
    const S = createBuilder()
    expect(() => S.document().singleton('article')).toThrow(SerializeError)
    expect(() => S.document().singleton('article')).toThrow(/is not a singleton/)
  })

  it('lets a subsequent .documentId() override the singleton default', () => {
    const S = createBuilder()
    const node = S.document().singleton('settings').documentId('override').serialize()
    expect(node.options.id).toBe('override')
    expect(node.options.type).toBe('settings')
  })

  it('lets a subsequent .schemaType() override the singleton default', () => {
    const S = createBuilder()
    const node = S.document().singleton('settings').schemaType('article').serialize()
    expect(node.options.id).toBe('settings')
    expect(node.options.type).toBe('article')
  })
})
