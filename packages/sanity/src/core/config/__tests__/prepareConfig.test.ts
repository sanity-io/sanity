import {describe, beforeEach, expect, it} from 'vitest'

import {getSchemaContentKey, _clearSchemaCache, prepareConfig} from '../prepareConfig'
import {SchemaError} from '../SchemaError'

describe('getSchemaContentKey', () => {
  it('returns the same key for identical type arrays', () => {
    const types = [{type: 'document', name: 'post', fields: [{name: 'title', type: 'string'}]}]
    const typesClone = [{type: 'document', name: 'post', fields: [{name: 'title', type: 'string'}]}]

    expect(getSchemaContentKey(types)).toBe(getSchemaContentKey(typesClone))
  })

  it('returns different keys for different type arrays', () => {
    const typesA = [{type: 'document', name: 'post', fields: [{name: 'title', type: 'string'}]}]
    const typesB = [{type: 'document', name: 'author', fields: [{name: 'name', type: 'string'}]}]

    expect(getSchemaContentKey(typesA)).not.toBe(getSchemaContentKey(typesB))
  })

  it('handles functions by serializing their body', () => {
    const typesA = [{name: 'post', prepare: (data: unknown) => ({title: String(data)})}]
    const typesACopy = [{name: 'post', prepare: (data: unknown) => ({title: String(data)})}]

    // Same function body produces same key
    expect(getSchemaContentKey(typesA)).toBe(getSchemaContentKey(typesACopy))

    // Different function body produces different key
    const typesB = [{name: 'post', prepare: (data: unknown) => ({title: `prefix: ${data}`})}]
    expect(getSchemaContentKey(typesA)).not.toBe(getSchemaContentKey(typesB))
  })

  it('returns null for types with circular references', () => {
    const typeA: any = {name: 'post'}
    typeA.self = typeA // circular reference
    expect(getSchemaContentKey([typeA])).toBeNull()
  })

  it('treats undefined fields as equivalent to missing fields', () => {
    const typesA = [{name: 'post', description: undefined}]
    const typesB = [{name: 'post'}]
    // JSON.stringify drops undefined — these produce the same key
    expect(getSchemaContentKey(typesA)).toBe(getSchemaContentKey(typesB))
  })
})

describe('prepareConfig schema caching', () => {
  beforeEach(() => {
    _clearSchemaCache()
  })

  it('workspaces with different names get different Schema objects even with identical types', () => {
    const config = [
      {
        name: 'workspace-a',
        basePath: '/a',
        projectId: 'ppsg7ml5',
        dataset: 'production',
        schema: {
          types: [
            {type: 'document' as const, name: 'post', fields: [{name: 'title', type: 'string'}]},
          ],
        },
      },
      {
        name: 'workspace-b',
        basePath: '/b',
        projectId: 'ppsg7ml5',
        dataset: 'staging',
        schema: {
          types: [
            {type: 'document' as const, name: 'post', fields: [{name: 'title', type: 'string'}]},
          ],
        },
      },
    ]

    const {workspaces} = prepareConfig(config)

    expect(workspaces).toHaveLength(2)
    // Different source.name means different cache key — Schema objects should differ
    expect(workspaces[0].schema).not.toBe(workspaces[1].schema)
  })

  it('workspaces with different schema types get different Schema objects', () => {
    const config = [
      {
        name: 'workspace-a',
        basePath: '/a',
        projectId: 'ppsg7ml5',
        dataset: 'production',
        schema: {
          types: [
            {type: 'document' as const, name: 'post', fields: [{name: 'title', type: 'string'}]},
          ],
        },
      },
      {
        name: 'workspace-b',
        basePath: '/b',
        projectId: 'ppsg7ml5',
        dataset: 'staging',
        schema: {
          types: [
            {
              type: 'document' as const,
              name: 'author',
              fields: [{name: 'name', type: 'string'}],
            },
          ],
        },
      },
    ]

    const {workspaces} = prepareConfig(config)

    expect(workspaces).toHaveLength(2)
    expect(workspaces[0].schema).not.toBe(workspaces[1].schema)
  })

  it('reuses schema across separate prepareConfig calls with same name and types', () => {
    const config1 = {
      name: 'default',
      projectId: 'ppsg7ml5',
      dataset: 'production',
      schema: {
        types: [
          {type: 'document' as const, name: 'post', fields: [{name: 'title', type: 'string'}]},
        ],
      },
    }
    const config2 = {
      name: 'default',
      projectId: 'ppsg7ml5',
      dataset: 'staging',
      schema: {
        types: [
          {type: 'document' as const, name: 'post', fields: [{name: 'title', type: 'string'}]},
        ],
      },
    }

    const result1 = prepareConfig(config1)
    const result2 = prepareConfig(config2)
    // Different config object references bypass the WeakMap,
    // but the schema cache should still share the Schema object
    expect(result1.workspaces[0].schema).toBe(result2.workspaces[0].schema)
  })

  it('schema with validation errors throws SchemaError', () => {
    // A schema type with an invalid field configuration should throw SchemaError
    const config = {
      name: 'default',
      projectId: 'ppsg7ml5',
      dataset: 'production',
      schema: {
        types: [
          {
            type: 'document' as const,
            name: 'post',
            fields: [
              {
                name: 'title',
                type: 'nonExistentType',
              },
            ],
          },
        ],
      },
    }

    expect(() => prepareConfig(config)).toThrow(SchemaError)
  })
})
