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
        name: 'siteSettings',
        type: 'document',
        title: 'Site Settings',
        singleton: {documentId: 'site-settings'},
        fields: [{name: 'title', type: 'string'}],
      }),
      defineType({
        name: 'navigation',
        type: 'document',
        // No `title` — falls back to startCase('navigation') => 'Navigation'.
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

describe('ListItemBuilder.singleton()', () => {
  it('uses the schema type title as the default list item title', () => {
    const S = createBuilder()
    const item = S.listItem().singleton('siteSettings').serialize()
    expect(item.id).toBe('siteSettings')
    expect(item.title).toBe('Site Settings')
    expect(item.schemaType?.name).toBe('siteSettings')
  })

  it('falls back to startCase(schemaTypeName) when the schema type has no title', () => {
    const S = createBuilder()
    const item = S.listItem().singleton('navigation').serialize()
    expect(item.title).toBe('Navigation')
  })

  it('uses S.document().singleton() as the default child', () => {
    const S = createBuilder()
    const item = S.listItem().singleton('siteSettings').serialize()
    // child is serialized eagerly when it is a builder, so it should be a
    // resolved DocumentNode pointing at the singleton document.
    const child = item.child as {
      type: string
      options: {id: string; type: string}
    }
    expect(child.type).toBe('document')
    expect(child.options.id).toBe('site-settings')
    expect(child.options.type).toBe('siteSettings')
  })

  it('preserves user overrides for id, title and child', () => {
    const S = createBuilder()
    const item = S.listItem()
      .id('mySettings')
      .title('My Settings')
      .singleton('siteSettings')
      .serialize()
    expect(item.id).toBe('mySettings')
    expect(item.title).toBe('My Settings')
  })

  it('throws immediately when given a non-singleton schema type', () => {
    const S = createBuilder()
    expect(() => S.listItem().singleton('article')).toThrow(SerializeError)
    expect(() => S.listItem().singleton('article')).toThrow(/is not a singleton/)
  })

  it('throws immediately when given an unknown schema type', () => {
    const S = createBuilder()
    expect(() => S.listItem().singleton('typo')).toThrow(SerializeError)
  })
})
