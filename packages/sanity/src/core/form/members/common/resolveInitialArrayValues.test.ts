import {
  type ArraySchemaType,
  defineField,
  defineType,
  isArraySchemaType,
  type ObjectSchemaType,
  type SchemaType,
} from '@sanity/types'
import {firstValueFrom, toArray} from 'rxjs'
import {describe, expect, test} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {set, unset} from '../../patch/patch'
import {type ObjectItem} from '../../types/itemProps'
import {resolveInitialArrayValues} from './resolveInitialArrayValues'

const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'author',
      type: 'object',
      fields: [defineField({name: 'name', type: 'string'})],
    }),
    defineType({
      name: 'editor',
      type: 'object',
      fields: [defineField({name: 'name', type: 'string'})],
    }),
    defineType({
      name: 'article',
      type: 'document',
      fields: [
        defineField({
          name: 'authors',
          type: 'array',
          of: [{type: 'author'}],
        }),
        defineField({
          name: 'contributors',
          type: 'array',
          of: [{type: 'author'}, {type: 'editor'}],
        }),
        defineField({
          name: 'quotes',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [defineField({name: 'text', type: 'string'})],
            },
          ],
        }),
      ],
    }),
  ],
})

const compiledArticle = schema.get('article')
if (!compiledArticle || compiledArticle.jsonType !== 'object') {
  throw new Error('Expected the compiled article document type')
}

function getArrayField(fieldName: string): ArraySchemaType {
  const field = (compiledArticle as ObjectSchemaType).fields.find(
    (member) => member.name === fieldName,
  )
  if (!field || !isArraySchemaType(field.type)) {
    throw new Error(`Expected array field ${fieldName}`)
  }
  return field.type
}

const authors = getArrayField('authors')
const contributors = getArrayField('contributors')
const quotes = getArrayField('quotes')

const authorType = authors.of[0]

interface InitialItem extends ObjectItem {
  name?: string
  text?: string
  _weak?: boolean
}

function collect(
  items: InitialItem[],
  schemaType: ArraySchemaType,
  resolver: (type: SchemaType, params: Record<string, unknown>) => Promise<InitialItem>,
) {
  return firstValueFrom(resolveInitialArrayValues(items, schemaType, resolver).pipe(toArray()))
}

function resolvingPatch(key: string) {
  return {
    type: 'patch' as const,
    patches: [set(true, [{_key: key}, '_resolvingInitialValue'])],
  }
}

function assignPatches(key: string, values: Record<string, unknown>) {
  return {
    type: 'patch' as const,
    patches: Object.entries(values).map(([field, value]) => set(value, [{_key: key}, field])),
  }
}

function resolvedPatch(key: string) {
  return {
    type: 'patch' as const,
    patches: [unset([{_key: key}, '_resolvingInitialValue'])],
  }
}

describe('resolveInitialArrayValues', () => {
  test('emits nothing when there are no items', async () => {
    const resolver = async () => ({_key: 'unused', name: 'Ada'})

    await expect(collect([], authors, resolver)).resolves.toEqual([])
  })

  test('marks an empty typed item as resolving, assigns the initial fields, then clears the flag', async () => {
    const item = {_key: 'a', _type: 'author'}

    await expect(
      collect([item], authors, async () => ({_key: 'a', _type: 'author', name: 'Ada'})),
    ).resolves.toEqual([
      resolvingPatch('a'),
      assignPatches('a', {_key: 'a', _type: 'author', name: 'Ada'}),
      resolvedPatch('a'),
    ])
  })

  test('passes the matching member type and the item to the resolver', async () => {
    const item = {_key: 'a', _type: 'author'}
    const seen: {typeName: string; params: Record<string, unknown>}[] = []

    await collect([item], authors, async (type, params) => {
      seen.push({typeName: type.name, params})
      return {_key: 'a', _type: 'author', name: 'Ada'}
    })

    expect(seen).toEqual([{typeName: 'author', params: item}])
  })

  test('skips items that already have content', async () => {
    const calls: string[] = []

    await expect(
      collect([{_key: 'a', _type: 'author', name: 'Ada'}], authors, async () => {
        calls.push('resolver')
        return {_key: 'a', _type: 'author', name: 'Bea'}
      }),
    ).resolves.toEqual([])

    expect(calls).toEqual([])
  })

  test('treats items that only have key, type and weak as empty', async () => {
    const item = {_key: 'a', _type: 'author', _weak: true}

    await expect(
      collect([item], authors, async () => ({_key: 'a', _type: 'author', name: 'Ada'})),
    ).resolves.toEqual([
      resolvingPatch('a'),
      assignPatches('a', {_key: 'a', _type: 'author', name: 'Ada'}),
      resolvedPatch('a'),
    ])
  })

  test('emits nothing when the item type is not in the array of-types', async () => {
    const calls: string[] = []

    await expect(
      collect([{_key: 'a', _type: 'reviewer'}], authors, async () => {
        calls.push('resolver')
        return {_key: 'a', _type: 'reviewer'}
      }),
    ).resolves.toEqual([])

    expect(calls).toEqual([])
  })

  test('does not guess a named member when the item has no type', async () => {
    const calls: string[] = []

    await expect(
      collect([{_key: 'a'}], authors, async () => {
        calls.push('resolver')
        return {_key: 'a', _type: 'author', name: 'Ada'}
      }),
    ).resolves.toEqual([])

    expect(calls).toEqual([])
  })

  test('resolves an anonymous object member from an item typed as object', async () => {
    const item = {_key: 'q', _type: 'object'}

    await expect(
      collect([item], quotes, async () => ({_key: 'q', _type: 'object', text: 'Hello'})),
    ).resolves.toEqual([
      resolvingPatch('q'),
      assignPatches('q', {_key: 'q', _type: 'object', text: 'Hello'}),
      resolvedPatch('q'),
    ])
  })

  test('emits an error for a rejected resolver and still clears the resolving flag', async () => {
    const item = {_key: 'a', _type: 'author'}
    const error = new Error('template exploded')

    await expect(
      collect([item], authors, async () => {
        throw error
      }),
    ).resolves.toEqual([
      resolvingPatch('a'),
      {type: 'error', error, item, schemaType: authorType},
      resolvedPatch('a'),
    ])
  })

  test('in a polymorphic array, only the empty item whose type matches a member is resolved', async () => {
    const author = {_key: 'a', _type: 'author'}
    const editor = {_key: 'e', _type: 'editor'}
    const unknown = {_key: 'x', _type: 'reviewer'}
    const filled = {_key: 'f', _type: 'author', name: 'Filled'}
    const resolved: string[] = []

    const events = await collect(
      [author, unknown, filled, editor],
      contributors,
      async (type, params) => {
        resolved.push(`${String(params._key)}:${type.name}`)
        return {_key: String(params._key), _type: type.name, name: type.name}
      },
    )

    expect(resolved).toEqual(['a:author', 'e:editor'])
    expect(events).toEqual([
      resolvingPatch('a'),
      resolvingPatch('e'),
      assignPatches('a', {_key: 'a', _type: 'author', name: 'author'}),
      resolvedPatch('a'),
      assignPatches('e', {_key: 'e', _type: 'editor', name: 'editor'}),
      resolvedPatch('e'),
    ])
  })
})
