import {type ObjectSchemaType, type Rule} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {compileManifestSchema, prepareManifestTypesForWorker} from '../validationWorkerHost'

describe('prepareManifestTypesForWorker', () => {
  it('drops conditional hidden and readOnly markers the validation context cannot evaluate', () => {
    const [type] = prepareManifestTypesForWorker([
      {
        name: 'article',
        type: 'document',
        hidden: 'conditional',
        fields: [
          {name: 'title', type: 'string', readOnly: 'conditional', hidden: false},
          {name: 'summary', type: 'string', readOnly: true},
        ],
      },
    ]) as [Record<string, unknown>]

    expect(type).not.toHaveProperty('hidden')
    expect(type.fields).toEqual([
      {name: 'title', type: 'string', hidden: false},
      {name: 'summary', type: 'string', readOnly: true},
    ])
  })

  it('marks slug uniqueness as custom on slugs and on types extending slug', () => {
    const types = prepareManifestTypesForWorker([
      {name: 'mySlug', type: 'slug', options: {source: 'title'}},
      {
        name: 'article',
        type: 'document',
        fields: [
          {name: 'slug', type: 'slug'},
          {name: 'other', type: 'mySlug'},
          {name: 'title', type: 'string'},
        ],
      },
    ]) as Array<Record<string, any>>

    expect(types[0].options).toMatchObject({source: 'title', isUnique: expect.any(Function)})
    expect(types[1].fields[0].options).toMatchObject({isUnique: expect.any(Function)})
    expect(types[1].fields[1].options).toMatchObject({isUnique: expect.any(Function)})
    expect(types[1].fields[2]).not.toHaveProperty('options')
  })

  it('removes all and either rules and empty validation groups', () => {
    const [type] = prepareManifestTypesForWorker([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'code',
            type: 'string',
            validation: [
              {level: 'error', rules: [{flag: 'either', constraint: []}]},
              {
                level: 'warning',
                rules: [
                  {flag: 'min', constraint: 2},
                  {flag: 'all', constraint: []},
                ],
              },
            ],
          },
        ],
      },
    ]) as [Record<string, any>]

    expect(type.fields[0].validation).toEqual([
      {level: 'warning', rules: [{flag: 'min', constraint: 2}]},
    ])
  })

  it('names anonymous object members next to a block member', () => {
    const [type] = prepareManifestTypesForWorker([
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'body',
            type: 'array',
            of: [{type: 'block'}, {type: 'object', fields: [{name: 'x', type: 'string'}]}],
          },
          {
            name: 'plain',
            type: 'array',
            of: [{type: 'object', fields: [{name: 'x', type: 'string'}]}],
          },
        ],
      },
    ]) as [Record<string, any>]

    expect(type.fields[0].of[1]).toMatchObject({type: 'object', name: 'object'})
    expect(type.fields[1].of[0]).not.toHaveProperty('name')
  })
})

describe('compileManifestSchema', () => {
  it('compiles a manifest and reports no unsupported types', () => {
    const {schema, unsupportedTypes} = compileManifestSchema('test', [
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'title',
            type: 'string',
            validation: [{level: 'error', rules: [{flag: 'presence', constraint: 'required'}]}],
          },
        ],
      },
    ])

    expect(unsupportedTypes).toEqual([])
    const article = schema.get('article') as ObjectSchemaType
    const rules = article.fields.find((field) => field.name === 'title')?.type.validation
    expect(typeof rules === 'function' || Array.isArray(rules)).toBe(true)
  })

  it('leaves out types the schema validator rejects, and the types referring to them', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const {schema, unsupportedTypes} = compileManifestSchema('test', [
      {name: 'fine', type: 'document', fields: [{name: 'title', type: 'string'}]},
      // a document without fields is rejected
      {name: 'broken', type: 'document', fields: []},
      {
        name: 'referrer',
        type: 'document',
        fields: [{name: 'target', type: 'reference', to: [{type: 'broken'}]}],
      },
    ])

    expect(unsupportedTypes).toEqual(['broken', 'referrer'])
    expect(schema.get('fine')).toBeDefined()
    expect(schema.get('broken')).toBeUndefined()
    expect(schema.get('referrer')).toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('rethrows when the failure is not attributable to a type', () => {
    expect(() => compileManifestSchema('test', [null])).toThrow()
  })
})

describe('manifest rules that reach the worker', () => {
  it('keeps built-in rule groups with their level and message', () => {
    const {schema} = compileManifestSchema('test', [
      {
        name: 'article',
        type: 'document',
        fields: [
          {
            name: 'title',
            type: 'string',
            validation: [
              {level: 'warning', message: 'Keep it short', rules: [{flag: 'max', constraint: 5}]},
            ],
          },
        ],
      },
    ])
    const article = schema.get('article') as ObjectSchemaType
    const validation = article.fields.find((field) => field.name === 'title')?.type.validation
    const builders = (Array.isArray(validation) ? validation : [validation]).filter(
      (entry): entry is (rule: Rule) => Rule => typeof entry === 'function',
    )
    expect(builders).toHaveLength(1)
  })
})
