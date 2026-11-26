import {
  defineField,
  defineType,
  type FieldDefinition,
  isObjectSchemaType,
  type ObjectField,
} from '@sanity/types'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {
  RELEASE_METADATA_TYPE_NAME,
  RESERVED_RELEASE_METADATA_NAMES,
  releaseMetadataSchema,
} from '../../schema/releaseMetadata'
import {acceptCompiledReleaseMetadataFields} from '../releaseMetadataFormType'

const note = defineField({name: 'note', type: 'string', title: 'Note'})

function compileMetadata(fields: FieldDefinition[]) {
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
      releaseMetadataSchema({fields: [note, ...fields]}),
    ],
  })
}

function customFields(fields: FieldDefinition[]): ObjectField[] {
  const metadataType = compileMetadata(fields).get(RELEASE_METADATA_TYPE_NAME)
  if (!isObjectSchemaType(metadataType)) throw new Error('Expected an object type')
  return metadataType.fields.filter((field) => !RESERVED_RELEASE_METADATA_NAMES.has(field.name))
}

function acceptedNames(fields: FieldDefinition[]): string[] {
  return acceptCompiledReleaseMetadataFields(customFields(fields)).map((field) => field.name)
}

function CustomInput() {
  return null
}

describe('acceptCompiledReleaseMetadataFields', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

  beforeEach(() => {
    warn.mockClear()
  })

  afterEach(() => {
    warn.mockClear()
  })

  it('keeps an alias that resolves to string and drops an alias that resolves to image', () => {
    const accepted = acceptCompiledReleaseMetadataFields(
      customFields([
        defineField({name: 'status', type: 'reviewStatus', title: 'Status'}),
        defineField({name: 'hero', type: 'heroImage', title: 'Hero'}),
      ]),
    )

    expect(accepted.map((field) => field.name)).toEqual(['note', 'status'])
    expect(accepted[1]?.type.name).toBe('reviewStatus')
    expect(warn).toHaveBeenCalledWith(
      `[releases] The release dialog doesn't show metadata field "hero" yet: type "image" is not supported`,
    )
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
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(`doesn't show metadata field "${field.name}"`),
    )
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

  it('drops an object with an unsupported field inside it', () => {
    expect(
      acceptedNames([
        defineField({
          name: 'signOff',
          type: 'object',
          fields: [
            defineField({name: 'reviewer', type: 'string'}),
            defineField({name: 'picture', type: 'image'}),
          ],
        }),
      ]),
    ).toEqual(['note'])
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(`doesn't show metadata field "signOff" yet: field "picture"`),
    )
  })

  it('reports a field with an unknown type as a schema error', () => {
    const schema = compileMetadata([defineField({name: 'missing', type: 'doesNotExist'})])

    const problems = (schema._validation ?? []).flatMap((group) => group.problems)
    expect(problems).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        message: expect.stringContaining('doesNotExist'),
      }),
    )
  })
})
