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
  it('includes `system.release` and the default `sanity.releaseMetadata`', () => {
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
    expect(schema.getLocalTypeNames()).toEqual(
      expect.arrayContaining(['system.release', 'sanity.releaseMetadata']),
    )
  })

  it('uses a custom `sanity.releaseMetadata` and keeps the core fields', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineReleaseMetadata({
          fields: [
            defineField({name: 'legalReview', type: 'string'}),
            defineField({name: 'title', type: 'string', title: 'Release name'}),
          ],
        }),
      ],
    })

    expect(hasErrors(schema)).toBe(false)

    const metadata = schema.get('sanity.releaseMetadata') as ObjectSchemaType
    expect(fieldNames(metadata)).toEqual([
      'description',
      'releaseType',
      'intendedPublishAt',
      'cardinality',
      'legalReview',
      'title',
    ])
    expect(metadata.fields.find((field) => field.name === 'title')?.type.title).toBe('Release name')

    const release = schema.get('system.release') as ObjectSchemaType
    expect(fieldNames(release.fields.find((field) => field.name === 'metadata')?.type)).toContain(
      'legalReview',
    )
  })

  it('reports an error when a core field does not store a string', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineReleaseMetadata({
          fields: [defineField({name: 'releaseType', type: 'number'})],
        }),
      ],
    })

    expect(hasErrors(schema)).toBe(true)
    const messages = (schema._validation ?? []).flatMap((group) =>
      group.problems.map((problem) => problem.message),
    )
    expect(messages).toContain(
      'The "releaseType" field of "sanity.releaseMetadata" must store a string, but its type "number" stores a number.',
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
