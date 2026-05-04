import {Schema} from '@sanity/schema'
import {type ObjectSchemaType, type Schema as SchemaInstance, type SchemaType} from '@sanity/types'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createCallbackResolver} from '../createCallbackResolver'

const MOCK_USER = {id: 'u', name: 'u', email: 'u@u', roles: []}

function compile(types: unknown[]): SchemaInstance {
  return Schema.compile({name: 'test', types: types as never})
}

function getType(schema: SchemaInstance, name: string): ObjectSchemaType {
  const type = schema.get(name) as SchemaType | undefined
  if (!type) throw new Error(`Type ${name} not found`)
  return type as ObjectSchemaType
}

describe('createCallbackResolver', () => {
  let resolveHidden: ReturnType<typeof createCallbackResolver<'hidden'>>
  let resolveReadOnly: ReturnType<typeof createCallbackResolver<'readOnly'>>

  beforeEach(() => {
    resolveHidden = createCallbackResolver({property: 'hidden'})
    resolveReadOnly = createCallbackResolver({property: 'readOnly'})
  })

  describe('no-callback short-circuit', () => {
    test('returns undefined for a flat object with no callbacks', () => {
      const schema = compile([
        {
          name: 'book',
          type: 'document',
          fields: [
            {name: 'title', type: 'string'},
            {name: 'subtitle', type: 'string'},
          ],
        },
      ])
      const schemaType = getType(schema, 'book')
      const documentValue = {_id: 'a', _type: 'book', title: 'hello', subtitle: 'world'}

      expect(resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})).toBeUndefined()
      expect(resolveReadOnly({currentUser: MOCK_USER, documentValue, schemaType})).toBeUndefined()
    })

    test('returns undefined for nested objects/arrays when no callbacks exist anywhere', () => {
      const schema = compile([
        {
          name: 'book',
          type: 'document',
          fields: [
            {name: 'title', type: 'string'},
            {
              name: 'author',
              type: 'object',
              fields: [
                {name: 'firstName', type: 'string'},
                {name: 'lastName', type: 'string'},
              ],
            },
            {
              name: 'quotes',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'quote',
                  fields: [
                    {name: 'text', type: 'string'},
                    {name: 'page', type: 'number'},
                  ],
                },
              ],
            },
          ],
        },
      ])
      const schemaType = getType(schema, 'book')
      const documentValue = {
        _id: 'a',
        _type: 'book',
        author: {firstName: 'A', lastName: 'B'},
        quotes: [{_key: 'k1', _type: 'quote', text: 'hi', page: 1}],
      }

      expect(resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})).toBeUndefined()
      expect(resolveReadOnly({currentUser: MOCK_USER, documentValue, schemaType})).toBeUndefined()
    })
  })

  describe('walks when callbacks exist', () => {
    test('detects a `hidden` callback at the root', () => {
      const schema = compile([
        {
          name: 'book',
          type: 'document',
          hidden: () => true,
          fields: [{name: 'title', type: 'string'}],
        },
      ])
      const schemaType = getType(schema, 'book')
      const documentValue = {_id: 'a', _type: 'book'}

      const result = resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})
      expect(result).toEqual({value: true})
    })

    test('detects a `hidden` callback on a nested field', () => {
      const schema = compile([
        {
          name: 'book',
          type: 'document',
          fields: [
            {name: 'title', type: 'string'},
            {name: 'subtitle', type: 'string', hidden: () => true},
          ],
        },
      ])
      const schemaType = getType(schema, 'book')
      const documentValue = {_id: 'a', _type: 'book'}

      const result = resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})
      expect(result).toEqual({children: {subtitle: {value: true}}})
    })

    test('detects a `hidden` callback inside an array item type', () => {
      const schema = compile([
        {
          name: 'book',
          type: 'document',
          fields: [
            {
              name: 'quotes',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'quote',
                  fields: [{name: 'text', type: 'string', hidden: () => true}],
                },
              ],
            },
          ],
        },
      ])
      const schemaType = getType(schema, 'book')
      const documentValue = {
        _id: 'a',
        _type: 'book',
        quotes: [{_key: 'k1', _type: 'quote', text: 'hi'}],
      }

      const result = resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})
      expect(result).toEqual({
        children: {quotes: {children: {k1: {children: {text: {value: true}}}}}},
      })
    })

    test('detects constant `hidden: true` on a field (does not require a callback)', () => {
      const schema = compile([
        {
          name: 'book',
          type: 'document',
          fields: [
            {name: 'title', type: 'string'},
            {name: 'subtitle', type: 'string', hidden: true},
          ],
        },
      ])
      const schemaType = getType(schema, 'book')
      const documentValue = {_id: 'a', _type: 'book'}

      const result = resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})
      expect(result).toEqual({children: {subtitle: {value: true}}})
    })

    test('passes the document value to the callback', () => {
      const callback = vi.fn(() => false)
      const schema = compile([
        {
          name: 'book',
          type: 'document',
          fields: [{name: 'title', type: 'string', hidden: callback}],
        },
      ])
      const schemaType = getType(schema, 'book')
      const documentValue = {_id: 'a', _type: 'book', title: 'hello'}

      resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({document: documentValue, currentUser: MOCK_USER}),
      )
    })
  })

  describe('cyclic schemas', () => {
    test('does not blow the stack on a self-referential schema with no callbacks', () => {
      const schema = compile([
        {
          name: 'tree',
          type: 'document',
          fields: [
            {name: 'label', type: 'string'},
            {name: 'children', type: 'array', of: [{type: 'tree'}]},
          ],
        },
      ])
      const schemaType = getType(schema, 'tree')
      const documentValue = {_id: 'a', _type: 'tree', label: 'root'}

      expect(() => resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})).not.toThrow()
      expect(resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})).toBeUndefined()
    })

    test('finds a callback inside a self-referential schema', () => {
      const schema = compile([
        {
          name: 'tree',
          type: 'document',
          fields: [
            {name: 'label', type: 'string', hidden: () => true},
            {name: 'children', type: 'array', of: [{type: 'tree'}]},
          ],
        },
      ])
      const schemaType = getType(schema, 'tree')
      const documentValue = {_id: 'a', _type: 'tree'}

      const result = resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})
      expect(result).toEqual({children: {label: {value: true}}})
    })
  })

  describe('inputOverride', () => {
    test('returns `{value: true}` when the property override is `true`', () => {
      const schema = compile([
        {
          name: 'book',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        },
      ])
      const schemaType = getType(schema, 'book')
      const documentValue = {_id: 'a', _type: 'book'}

      expect(
        resolveReadOnly({currentUser: MOCK_USER, documentValue, schemaType, readOnly: true}),
      ).toEqual({value: true})
    })
  })

  describe('caching', () => {
    test('returns the same reference for the same inputs called twice', () => {
      const callback = vi.fn(() => false)
      const schema = compile([
        {
          name: 'book',
          type: 'document',
          fields: [{name: 'title', type: 'string', hidden: callback}],
        },
      ])
      const schemaType = getType(schema, 'book')
      const documentValue = {_id: 'a', _type: 'book'}

      const first = resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})
      const second = resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})

      expect(second).toBe(first)
      // The callback was only invoked once because the second call hit the
      // reference-equality cache.
      expect(callback).toHaveBeenCalledTimes(1)
    })

    test('schemas that reach MAX_FIELD_DEPTH still emit the original marker tree', () => {
      // Behaviour preservation: the original `resolveCallbackState` walk
      // emits `{value: false}` markers at depth 20 and propagates `{children:
      // …}` upward. The structural cache is depth-aware so it does NOT
      // short-circuit deep schemas — they fall through to the original walk
      // and produce the same shape they did before this optimization.
      // Regression alarm: if this test starts returning `undefined`, the
      // depth check has been bypassed and behaviour has silently changed.
      let typeDef: Record<string, unknown> = {name: 'leaf', type: 'string'}
      for (let i = 0; i < 22; i++) {
        typeDef = {
          name: `level${i}`,
          type: 'object',
          fields: [typeDef as never],
        }
      }
      const schema = compile([{name: 'root', type: 'document', fields: [typeDef as never]}])
      const schemaType = getType(schema, 'root')
      const documentValue = {_id: 'a', _type: 'root'}

      const result = resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})
      expect(result).toBeDefined()
      expect(result).toHaveProperty('children')
    })

    test('shallow no-callback schemas still short-circuit to `undefined`', () => {
      // Companion to the depth-aware preservation test above: schemas that
      // do NOT reach MAX_FIELD_DEPTH should hit the structural-cache short
      // circuit and skip the recursive walk entirely.
      const schema = compile([
        {
          name: 'shallow',
          type: 'document',
          fields: [
            {name: 'a', type: 'string'},
            {
              name: 'nested',
              type: 'object',
              fields: [{name: 'inner', type: 'string'}],
            },
          ],
        },
      ])
      const schemaType = getType(schema, 'shallow')
      const documentValue = {_id: 'a', _type: 'shallow'}

      expect(resolveHidden({currentUser: MOCK_USER, documentValue, schemaType})).toBeUndefined()
    })

    test('the structural cache is shared across resolver instances', () => {
      // Schema with no callbacks anywhere — the structural cache classifies it
      // once and any subsequent resolver for the same `schemaType` short-circuits.
      const schema = compile([
        {
          name: 'flat',
          type: 'document',
          fields: [
            {name: 'a', type: 'string'},
            {name: 'b', type: 'string'},
            {name: 'c', type: 'string'},
          ],
        },
      ])
      const schemaType = getType(schema, 'flat')
      const documentValue = {_id: 'd', _type: 'flat'}

      const resolverA = createCallbackResolver({property: 'hidden'})
      const resolverB = createCallbackResolver({property: 'hidden'})

      expect(resolverA({currentUser: MOCK_USER, documentValue, schemaType})).toBeUndefined()
      expect(resolverB({currentUser: MOCK_USER, documentValue, schemaType})).toBeUndefined()
    })
  })
})
