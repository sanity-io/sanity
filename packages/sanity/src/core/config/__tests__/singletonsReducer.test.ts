import {describe, expect, it} from 'vitest'

import {singletonsReducer} from '../configPropertyReducers'
import {type ConfigContext, type PluginOptions, type SingletonDefinition} from '../types'

const context = {} as ConfigContext

const settingsDefinition: SingletonDefinition = {
  id: 'settingsSingleton',
  documentId: 'settingsDocument',
  schemaType: 'settingsSchema',
}

describe('singletonsReducer', () => {
  it('returns the previous definitions when no singletons are configured', () => {
    const config: PluginOptions = {name: 'test'}

    const result = singletonsReducer([settingsDefinition], config, context)

    expect(result).toEqual([settingsDefinition])
  })

  it('appends full definitions to the previous definitions', () => {
    const config: PluginOptions = {
      name: 'test',
      document: {
        singletons: [settingsDefinition],
      },
    }

    const previous: SingletonDefinition[] = [
      {id: 'other', documentId: 'other', schemaType: 'other'},
    ]

    const result = singletonsReducer(previous, config, context)

    expect(result).toEqual([...previous, settingsDefinition])
  })

  it('expands the string shorthand to a full definition', () => {
    const config: PluginOptions = {
      name: 'test',
      document: {
        singletons: ['settings'],
      },
    }

    const result = singletonsReducer([], config, context)

    expect(result).toEqual([
      {
        id: 'settings',
        documentId: 'settings',
        schemaType: 'settings',
      },
    ])
  })

  it('fills an omitted `id` with the definition `documentId`', () => {
    const config: PluginOptions = {
      name: 'test',
      document: {
        singletons: [{documentId: 'homepage', schemaType: 'page'}],
      },
    }

    const result = singletonsReducer([], config, context)

    expect(result).toEqual([
      {
        id: 'homepage',
        documentId: 'homepage',
        schemaType: 'page',
      },
    ])
  })

  it('normalizes resolver-function output', () => {
    const config: PluginOptions = {
      name: 'test',
      document: {
        singletons: (previous) => [
          ...previous,
          // Resolvers may return unresolved definitions: string shorthands
          // and definitions with an omitted id alike.
          'footer',
          {documentId: 'homepage', schemaType: 'page'},
        ],
      },
    }

    const result = singletonsReducer([settingsDefinition], config, context)

    expect(result).toEqual([
      settingsDefinition,
      {id: 'footer', documentId: 'footer', schemaType: 'footer'},
      {id: 'homepage', documentId: 'homepage', schemaType: 'page'},
    ])
  })

  it('invokes a resolver function with previously resolved definitions', () => {
    const config: PluginOptions = {
      name: 'test',
      document: {
        singletons: (previous, receivedContext) => {
          expect(receivedContext).toBe(context)
          // Resolver functions only ever see resolved definitions, even when
          // an earlier layer used the string shorthand.
          expect(previous).toEqual([
            {id: 'settings', documentId: 'settings', schemaType: 'settings'},
          ])
          return [...previous, settingsDefinition]
        },
      },
    }

    const shorthandLayer: PluginOptions = {
      name: 'shorthand',
      document: {
        singletons: ['settings'],
      },
    }

    const afterShorthand = singletonsReducer([], shorthandLayer, context)
    const result = singletonsReducer(afterShorthand, config, context)

    expect(result).toEqual([
      {id: 'settings', documentId: 'settings', schemaType: 'settings'},
      settingsDefinition,
    ])
  })

  it('throws when `document.singletons` is neither an array nor a function', () => {
    const config: PluginOptions = {
      name: 'test',
      document: {
        singletons: {id: 'settings'} as never,
      },
    }

    expect(() => singletonsReducer([], config, context)).toThrow(
      'Expected `document.singletons` to be an array or a function, but received object',
    )
  })
})
