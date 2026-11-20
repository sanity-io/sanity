import {defineField, defineType, type ObjectSchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {defineReleaseMetadata} from '../../releases/metadata/defineReleaseMetadata'
import {defaultTemplatesForSchema} from '../../templates/prepare'
import {defineVariantMetadata} from '../../variants/metadata/defineVariantMetadata'
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

  it('throws when `defineReleaseMetadata` is given a core field', () => {
    expect(() =>
      defineReleaseMetadata({
        fields: [
          defineField({name: 'legalReview', type: 'string'}),
          defineField({name: 'title', type: 'string', title: 'Release name'}),
        ],
      }),
    ).toThrow(
      "Can't declare `title` on `sanity.releaseMetadata`. Its core fields (`title`, `description`, `releaseType`, `intendedPublishAt`, `cardinality`) are always included, so only list the fields you add.",
    )
  })

  it('uses the built-in core field when a `sanity.releaseMetadata` declared without the helper redeclares one', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({
          name: 'sanity.releaseMetadata',
          type: 'object',
          fields: [
            defineField({name: 'title', type: 'number', title: 'Release name'}),
            defineField({name: 'legalReview', type: 'string'}),
          ],
        }),
      ],
    })

    expect(hasErrors(schema)).toBe(false)
    const metadata = schema.get('sanity.releaseMetadata') as ObjectSchemaType
    expect(fieldNames(metadata)).toEqual([
      'title',
      'description',
      'releaseType',
      'intendedPublishAt',
      'cardinality',
      'legalReview',
    ])
    expect(metadata.fields[0].type.name).toBe('string')
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

  it('does not create templates for `system.release` or `system.variant`', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineType({name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]}),
      ],
    })

    expect(defaultTemplatesForSchema(schema).map((template) => template.id)).toEqual(['author'])
  })
})

describe('createSchema: variant types', () => {
  it('includes `system.variant` and the default `sanity.variantMetadata` as built-in types', () => {
    const schema = createSchema({name: 'default', types: []})

    expect(hasErrors(schema)).toBe(false)

    const variant = schema.get('system.variant') as ObjectSchemaType
    expect(variant.jsonType).toBe('object')
    expect(variant.liveEdit).toBe(true)
    expect(variant.fields.find((field) => field.name === 'metadata')?.type.name).toBe(
      'sanity.variantMetadata',
    )

    expect(fieldNames(schema.get('sanity.variantMetadata'))).toEqual([
      'title',
      'description',
      'type',
    ])
  })

  it('uses a custom `sanity.variantMetadata` and keeps the core fields', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineVariantMetadata({
          fields: [defineField({name: 'owner', type: 'string'})],
        }),
      ],
    })

    expect(hasErrors(schema)).toBe(false)

    expect(fieldNames(schema.get('sanity.variantMetadata'))).toEqual([
      'title',
      'description',
      'type',
      'owner',
    ])

    const variant = schema.get('system.variant') as ObjectSchemaType
    expect(fieldNames(variant.fields.find((field) => field.name === 'metadata')?.type)).toContain(
      'owner',
    )
    expect(fieldNames(schema.get('sanity.releaseMetadata'))).not.toContain('owner')
    expect(schema.getLocalTypeNames()).toEqual(['sanity.variantMetadata'])
  })

  it('extends release and variant metadata in the same schema', () => {
    const schema = createSchema({
      name: 'default',
      types: [
        defineReleaseMetadata({fields: [defineField({name: 'legalReview', type: 'string'})]}),
        defineVariantMetadata({fields: [defineField({name: 'owner', type: 'string'})]}),
      ],
    })

    expect(hasErrors(schema)).toBe(false)
    expect(fieldNames(schema.get('sanity.releaseMetadata'))).toContain('legalReview')
    expect(fieldNames(schema.get('sanity.variantMetadata'))).toContain('owner')
  })

  it('throws when `defineVariantMetadata` is given a core field', () => {
    expect(() =>
      defineVariantMetadata({
        fields: [defineField({name: 'description', type: 'text'})],
      }),
    ).toThrow(
      "Can't declare `description` on `sanity.variantMetadata`. Its core fields (`title`, `description`, `type`) are always included, so only list the fields you add.",
    )
  })
})
