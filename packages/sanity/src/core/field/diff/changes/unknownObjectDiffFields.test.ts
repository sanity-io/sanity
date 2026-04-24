import {type ObjectSchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type ObjectDiff} from '../../types'
import {
  collectObjectSchemaFieldNames,
  getSortedUnknownChangedObjectFieldNames,
} from './unknownObjectDiffFields'

function docSchema(fields: ObjectSchemaType['fields']): ObjectSchemaType {
  return {
    name: 'article',
    jsonType: 'object',
    fields,
  } as ObjectSchemaType
}

describe('collectObjectSchemaFieldNames', () => {
  it('collects names from fields when there are no fieldsets', () => {
    const schema = docSchema([
      {name: 'title', type: {name: 'string', jsonType: 'string'} as any},
      {name: 'body', type: {name: 'text', jsonType: 'string'} as any},
    ])
    expect(collectObjectSchemaFieldNames(schema)).toEqual(new Set(['title', 'body']))
  })

  it('collects names from multi-fieldsets', () => {
    const schema = {
      ...docSchema([{name: 'unused', type: {name: 'string', jsonType: 'string'} as any}]),
      fieldsets: [
        {
          single: false as const,
          name: 'meta',
          fields: [
            {name: 'seo', type: {name: 'string', jsonType: 'string'} as any},
            {name: 'slug', type: {name: 'slug', jsonType: 'object'} as any},
          ],
        },
      ],
    } as ObjectSchemaType
    expect(collectObjectSchemaFieldNames(schema)).toEqual(new Set(['seo', 'slug']))
  })
})

describe('getSortedUnknownChangedObjectFieldNames', () => {
  const schema = docSchema([{name: 'title', type: {name: 'string', jsonType: 'string'} as any}])

  it('returns lexicographically sorted unknown keys that changed', () => {
    const diff = {
      type: 'object',
      fields: {
        zebra: {isChanged: true},
        title: {isChanged: true},
        orphan: {isChanged: true},
        unchanged: {isChanged: false},
      },
    } as unknown as ObjectDiff

    expect(getSortedUnknownChangedObjectFieldNames(schema, diff)).toEqual(['orphan', 'zebra'])
  })

  it('respects fieldFilter when provided', () => {
    const diff = {
      type: 'object',
      fields: {
        a: {isChanged: true},
        b: {isChanged: true},
      },
    } as unknown as ObjectDiff

    expect(getSortedUnknownChangedObjectFieldNames(schema, diff, ['b'])).toEqual(['b'])
  })

  it('omits `_system` even when not on schema (internal / noisy)', () => {
    const diff = {
      type: 'object',
      fields: {
        _system: {isChanged: true},
        orphan: {isChanged: true},
      },
    } as unknown as ObjectDiff

    expect(getSortedUnknownChangedObjectFieldNames(schema, diff)).toEqual(['orphan'])
  })
})
