import {defineField, defineType, type FieldDefinition} from '@sanity/types'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {
  acceptReleaseMetadataFields,
  compileReleaseMetadataSchema,
} from '../compileReleaseMetadataType'

const note = defineField({name: 'note', type: 'string', title: 'Note'})

function parentSchema() {
  return createSchema({
    name: 'workspace',
    types: [
      defineType({
        name: 'author',
        type: 'document',
        fields: [{name: 'name', type: 'string'}],
      }),
      defineType({name: 'reviewStatus', type: 'string'}),
      defineType({name: 'heroImage', type: 'image'}),
    ],
  })
}

function acceptedNames(fields: FieldDefinition[]): string[] {
  return acceptReleaseMetadataFields([note, ...fields], parentSchema()).map((field) => field.name)
}

function CustomInput() {
  return null
}

describe('acceptReleaseMetadataFields', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

  beforeEach(() => {
    warn.mockClear()
  })

  afterEach(() => {
    warn.mockClear()
  })

  it('keeps an alias that resolves to string and drops an alias that resolves to image', () => {
    const accepted = acceptReleaseMetadataFields(
      [
        defineField({name: 'status', type: 'reviewStatus', title: 'Status'}),
        defineField({name: 'hero', type: 'heroImage', title: 'Hero'}),
      ],
      parentSchema(),
    )

    expect(accepted.map((field) => field.name)).toEqual(['status'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Dropped field "hero"'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('type "image" is not supported'))

    const compiled = compileReleaseMetadataSchema(accepted, parentSchema())
    expect(compiled?.schemaType.fields[0]?.type.name).toBe('reviewStatus')
  })

  it.each([
    {
      name: 'reference',
      field: defineField({
        name: 'related',
        type: 'reference',
        to: [{type: 'author'}],
      }),
    },
    {
      name: 'crossDatasetReference',
      field: defineField({
        name: 'remote',
        type: 'crossDatasetReference',
        dataset: 'other',
        to: [{type: 'author', preview: {select: {title: 'name'}}}],
      }),
    },
    {name: 'image', field: defineField({name: 'picture', type: 'image'})},
    {name: 'file', field: defineField({name: 'attachment', type: 'file'})},
    {
      name: 'array',
      field: defineField({name: 'tags', type: 'array', of: [{type: 'string'}]}),
    },
    {
      name: 'block',
      field: defineField({
        name: 'body',
        type: 'array',
        of: [{type: 'block'}],
      }),
    },
    {name: 'slug', field: defineField({name: 'slug', type: 'slug'})},
  ])('drops a $name field and keeps the other fields', ({field}) => {
    expect(acceptedNames([field])).toEqual(['note'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(`Dropped field "${field.name}"`))
  })

  it('drops a field that sets a components override and keeps the rest', () => {
    expect(
      acceptedNames([
        defineField({
          name: 'custom',
          type: 'string',
          components: {input: CustomInput},
        }),
      ]),
    ).toEqual(['note'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('components.input'))
  })

  it('drops one field that cannot be compiled without hiding the rest', () => {
    expect(acceptedNames([defineField({name: 'missing', type: 'doesNotExist'})])).toEqual(['note'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Dropped field "missing"'))
  })

  it('drops an unsupported field inside an object and keeps the object', () => {
    const accepted = acceptReleaseMetadataFields(
      [
        defineField({
          name: 'signOff',
          type: 'object',
          fields: [
            defineField({name: 'reviewer', type: 'string'}),
            defineField({name: 'picture', type: 'image'}),
          ],
        }),
      ],
      parentSchema(),
    )

    expect(accepted.map((field) => field.name)).toEqual(['signOff'])
    const signOff = accepted[0]
    expect(isObjectField(signOff) ? signOff.fields?.map((field) => field.name) : []).toEqual([
      'reviewer',
    ])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Dropped field "signOff.picture"'))
  })
})

function isObjectField(
  field: FieldDefinition,
): field is FieldDefinition & {fields?: {name: string}[]} {
  return field.type === 'object'
}
