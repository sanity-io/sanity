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
      defineType({name: 'authorRef', type: 'reference', to: [{type: 'author'}]}),
      defineType({name: 'weakAuthorRef', type: 'reference', weak: true, to: [{type: 'author'}]}),
      defineType({
        name: 'strongSignOff',
        type: 'object',
        fields: [defineField({name: 'owner', type: 'reference', to: [{type: 'author'}]})],
      }),
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

  describe('reference fields', () => {
    const related = defineField({name: 'related', type: 'reference', to: [{type: 'author'}]})

    it('accepts a reference and forces it weak without warning', () => {
      expect(findAcceptedField([related], 'related')).toMatchObject({type: 'reference', weak: true})
      expect(warn).not.toHaveBeenCalled()
    })

    it('does not mutate the configured definition', () => {
      acceptedNames([related])
      expect(related).not.toHaveProperty('weak')
    })

    it('forces weak and warns when the config sets weak: false', () => {
      const strong = defineField({
        name: 'related',
        type: 'reference',
        weak: false,
        to: [{type: 'author'}],
      })

      expect(findAcceptedField([strong], 'related')).toMatchObject({weak: true})
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"related"'))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('weak: false is not supported'))
    })

    it('keeps an alias that resolves to a weak reference', () => {
      expect(acceptedNames([defineField({name: 'related', type: 'weakAuthorRef'})])).toEqual([
        'note',
        'related',
      ])
      expect(warn).not.toHaveBeenCalled()
    })

    it('drops an alias that resolves to a reference that is not weak', () => {
      expect(acceptedNames([defineField({name: 'related', type: 'authorRef'})])).toEqual(['note'])
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Dropped field "related"'))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('must set weak: true on the type'))
    })

    it('forces weak on a reference inside an inline object', () => {
      const signOff = defineField({
        name: 'signOff',
        type: 'object',
        fields: [defineField({name: 'owner', type: 'reference', to: [{type: 'author'}]})],
      })

      const accepted = findAcceptedField([signOff], 'signOff')
      expect(accepted.fields).toEqual([expect.objectContaining({name: 'owner', weak: true})])
      expect(warn).not.toHaveBeenCalled()
    })

    it('drops a named object that holds a reference that is not weak', () => {
      expect(acceptedNames([defineField({name: 'signOff', type: 'strongSignOff'})])).toEqual([
        'note',
      ])
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Dropped field "signOff"'))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('must set weak: true on the type'))
    })

    it('keeps initialValue on a reference without warning', () => {
      const initialValue = {_type: 'reference', _ref: 'author-1'}
      const seeded = defineField({
        name: 'related',
        type: 'reference',
        to: [{type: 'author'}],
        initialValue,
      })

      expect(findAcceptedField([seeded], 'related')).toMatchObject({weak: true, initialValue})
      expect(warn).not.toHaveBeenCalled()
    })

    it('compiles the weak reference into a weak schema type', () => {
      const accepted = acceptReleaseMetadataFields([related], parentSchema())
      const compiled = compileReleaseMetadataSchema(accepted, parentSchema())

      expect(compiled?.schemaType.fields[0]?.type).toMatchObject({name: 'reference', weak: true})
    })
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

function findAcceptedField(fields: FieldDefinition[], name: string): Record<string, unknown> {
  const accepted = acceptReleaseMetadataFields(fields, parentSchema()).find(
    (field) => field.name === name,
  )
  return {...accepted}
}

function isObjectField(
  field: FieldDefinition,
): field is FieldDefinition & {fields?: {name: string}[]} {
  return field.type === 'object'
}
