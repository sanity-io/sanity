import {Schema} from '@sanity/schema'
import {
  defineArrayMember,
  defineField,
  defineType,
  isObjectSchemaType,
  type ObjectSchemaType,
} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {getDocumentTitleFieldPath} from '../getDocumentTitleFieldPath'

function compile(types: Parameters<typeof Schema.compile>[0]['types']) {
  const schema = Schema.compile({name: 'test', types})

  return {
    get(name: string): ObjectSchemaType {
      const schemaType = schema.get(name)
      if (!isObjectSchemaType(schemaType)) {
        throw new Error(`Expected ${name} to be an object schema type`)
      }
      return schemaType
    },
  }
}

describe('getDocumentTitleFieldPath', () => {
  it('uses preview.select.title when it names a field on the document', () => {
    const schema = compile([
      defineType({
        name: 'article',
        type: 'document',
        fields: [
          defineField({name: 'title', type: 'string'}),
          defineField({name: 'slug', type: 'slug'}),
        ],
        preview: {select: {title: 'title', subtitle: 'slug.current'}},
      }),
    ])

    expect(getDocumentTitleFieldPath(schema.get('article'))).toEqual(['title'])
  })

  it('uses a nested object field addressed by select.title', () => {
    const schema = compile([
      defineType({
        name: 'article',
        type: 'document',
        fields: [
          defineField({
            name: 'seo',
            type: 'object',
            fields: [defineField({name: 'metaTitle', type: 'string'})],
          }),
        ],
        preview: {select: {title: 'seo.metaTitle'}},
      }),
    ])

    expect(getDocumentTitleFieldPath(schema.get('article'))).toEqual(['seo', 'metaTitle'])
  })

  it('keeps select.title when prepare() also rewrites the displayed title', () => {
    const schema = compile([
      defineType({
        name: 'article',
        type: 'document',
        fields: [
          defineField({name: 'title', type: 'string'}),
          defineField({name: 'author', type: 'string'}),
        ],
        preview: {
          select: {title: 'title', author: 'author'},
          prepare: ({title, author}) => ({title: author ? `${title} by ${author}` : title}),
        },
      }),
    ])

    expect(getDocumentTitleFieldPath(schema.get('article'))).toEqual(['title'])
  })

  it('does nothing when prepare() builds the title from several fields', () => {
    const schema = compile([
      defineType({
        name: 'person',
        type: 'document',
        fields: [
          defineField({name: 'firstName', type: 'string'}),
          defineField({name: 'lastName', type: 'string'}),
        ],
        preview: {
          select: {firstName: 'firstName', lastName: 'lastName'},
          prepare: ({firstName, lastName}) => ({title: `${firstName} ${lastName}`}),
        },
      }),
    ])

    expect(getDocumentTitleFieldPath(schema.get('person'))).toBeUndefined()
  })

  it('does nothing when select.title does not exist on the schema', () => {
    const schema = compile([
      defineType({
        name: 'article',
        type: 'document',
        fields: [defineField({name: 'title', type: 'string'})],
        preview: {select: {title: 'headline'}},
      }),
    ])

    expect(getDocumentTitleFieldPath(schema.get('article'))).toBeUndefined()
  })

  it('does nothing when select.title crosses into a referenced document', () => {
    const schema = compile([
      defineType({
        name: 'author',
        type: 'document',
        fields: [defineField({name: 'name', type: 'string'})],
      }),
      defineType({
        name: 'article',
        type: 'document',
        fields: [
          defineField({
            name: 'author',
            type: 'reference',
            to: [{type: 'author'}],
          }),
        ],
        preview: {select: {title: 'author.name'}},
      }),
    ])

    expect(getDocumentTitleFieldPath(schema.get('article'))).toBeUndefined()
  })

  it('does nothing when select.title addresses an array item', () => {
    const schema = compile([
      defineType({
        name: 'article',
        type: 'document',
        fields: [
          defineField({
            name: 'items',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'object',
                fields: [defineField({name: 'title', type: 'string'})],
              }),
            ],
          }),
        ],
        preview: {select: {title: 'items.0.title'}},
      }),
    ])

    expect(getDocumentTitleFieldPath(schema.get('article'))).toBeUndefined()
  })

  it('does nothing when the title field is hidden', () => {
    const schema = compile([
      defineType({
        name: 'article',
        type: 'document',
        fields: [defineField({name: 'title', type: 'string', hidden: true})],
        preview: {select: {title: 'title'}},
      }),
    ])

    expect(getDocumentTitleFieldPath(schema.get('article'))).toBeUndefined()
  })

  it('guesses the title field when the type has no preview config', () => {
    const schema = compile([
      defineType({
        name: 'article',
        type: 'document',
        fields: [
          defineField({name: 'title', type: 'string'}),
          defineField({name: 'description', type: 'string'}),
        ],
      }),
    ])

    expect(getDocumentTitleFieldPath(schema.get('article'))).toEqual(['title'])
  })

  it('does nothing when select.title reads a file name on an image asset', () => {
    const schema = compile([
      defineType({
        name: 'picture',
        type: 'document',
        fields: [defineField({name: 'image', type: 'image'})],
        preview: {select: {title: 'image.asset.originalFilename'}},
      }),
    ])

    expect(getDocumentTitleFieldPath(schema.get('picture'))).toBeUndefined()
  })

  it('does nothing when a type with no preview config has no direct title field', () => {
    const schema = compile([
      defineType({
        name: 'picture',
        type: 'document',
        fields: [defineField({name: 'image', type: 'image'})],
      }),
    ])

    expect(schema.get('picture').preview?.select?.title).toBeUndefined()
    expect(getDocumentTitleFieldPath(schema.get('picture'))).toBeUndefined()
  })

  it('still focuses a title field whose hidden callback may reveal it', () => {
    const schema = compile([
      defineType({
        name: 'article',
        type: 'document',
        fields: [defineField({name: 'title', type: 'string', hidden: () => false})],
        preview: {select: {title: 'title'}},
      }),
    ])

    expect(getDocumentTitleFieldPath(schema.get('article'))).toEqual(['title'])
  })
})
