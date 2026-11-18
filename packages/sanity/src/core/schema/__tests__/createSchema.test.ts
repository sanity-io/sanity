import {defineField, defineType, type ObjectSchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {defineReleaseMetadata} from '../../releases/metadata/defineReleaseMetadata'
import {defaultTemplatesForSchema} from '../../templates/prepare'
import {createSchema} from '../createSchema'

const fieldNames = (type: unknown) => (type as ObjectSchemaType).fields.map((field) => field.name)

const hasErrors = (schema: ReturnType<typeof createSchema>) =>
  (schema._validation ?? []).some((group) =>
    group.problems.some((problem) => problem.severity === 'error'),
  )

describe('createSchema: release types', () => {
  it('includes `system.release` and the default `sanity.releaseMetadata` as built-in types', () => {
    const schema = createSchema({name: 'default', types: []})

    expect(hasErrors(schema)).toBe(false)

    const release = schema.get('system.release') as ObjectSchemaType
    expect(release.jsonType).toBe('object')
    expect(release.liveEdit).toBe(true)
    expect(release.fields.find((field) => field.name === 'metadata')?.type.name).toBe(
      'sanity.releaseMetadata',
    )

    expect(fieldNames(schema.get('sanity.releaseMetadata'))).toEqual([
      'title',
      'description',
      'releaseType',
      'intendedPublishAt',
      'cardinality',
    ])
    expect(schema.getLocalTypeNames()).toEqual([])
  })

  it('uses a custom `sanity.releaseMetadata` and keeps the core fields', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineReleaseMetadata({
          fields: [defineField({name: 'legalReview', type: 'string'})],
        }),
      ],
    })

    expect(hasErrors(schema)).toBe(false)

    expect(fieldNames(schema.get('sanity.releaseMetadata'))).toEqual([
      'title',
      'description',
      'releaseType',
      'intendedPublishAt',
      'cardinality',
      'legalReview',
    ])

    const release = schema.get('system.release') as ObjectSchemaType
    expect(fieldNames(release.fields.find((field) => field.name === 'metadata')?.type)).toContain(
      'legalReview',
    )
    expect(schema.getLocalTypeNames()).toEqual(['sanity.releaseMetadata'])
  })

  it('accepts a custom `sanity.releaseMetadata` without fields', () => {
    const schema = createSchema({
      name: 'default',
      types: [defineReleaseMetadata({title: 'Release details'})],
    })

    expect(hasErrors(schema)).toBe(false)
    expect(schema.get('sanity.releaseMetadata')?.title).toBe('Release details')
    expect(fieldNames(schema.get('sanity.releaseMetadata'))).toContain('releaseType')
  })

  it('reports an error when a custom `sanity.releaseMetadata` declares a core field', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineReleaseMetadata({
          fields: [defineField({name: 'title', type: 'string', title: 'Release name'})],
        }),
      ],
    })

    expect(hasErrors(schema)).toBe(true)
    const messages = (schema._validation ?? []).flatMap((group) =>
      group.problems.map((problem) => problem.message),
    )
    expect(messages).toContain(
      'The names `title`, `description`, `releaseType`, `intendedPublishAt`, `cardinality` are invalid field names for type `sanity.releaseMetadata`. These core fields are always included.',
    )
  })

  it('does not collide with a user type named `releaseMetadata`', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'releaseMetadata',
          type: 'object',
          fields: [defineField({name: 'foo', type: 'number'})],
        }),
      ],
    })

    expect(hasErrors(schema)).toBe(false)
    expect(fieldNames(schema.get('releaseMetadata'))).toEqual(['foo'])
    expect(fieldNames(schema.get('sanity.releaseMetadata'))).toContain('releaseType')
  })

  it('does not create templates for `system.release`', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]}),
      ],
    })

    expect(defaultTemplatesForSchema(schema).map((template) => template.id)).toEqual(['author'])
  })
})
