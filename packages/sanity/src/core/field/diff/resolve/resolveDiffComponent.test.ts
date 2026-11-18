import {defineField, defineType, type ObjectSchemaType, type SchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {BooleanFieldDiff} from '../../types/boolean/diff/BooleanFieldDiff'
import {DatetimeFieldDiff} from '../../types/datetime/diff/DatetimeFieldDiff'
import {FileFieldDiff} from '../../types/file/diff/FileFieldDiff'
import {ImageFieldDiff} from '../../types/image/diff/ImageFieldDiff'
import {NumberFieldDiff} from '../../types/number/diff/NumberFieldDiff'
import {PTDiff} from '../../types/portableText/diff/PTDiff'
import {ReferenceFieldDiff} from '../../types/reference/diff/ReferenceFieldDiff'
import {SlugFieldDiff} from '../../types/slug/diff/SlugFieldDiff'
import {StringFieldDiff} from '../../types/string/diff/StringFieldDiff'
import {resolveDiffComponent} from './resolveDiffComponent'

function HeadlineDiff() {
  return null
}

function TitleDiff() {
  return null
}

const schema = createSchema({
  name: 'test',
  types: [
    defineType({
      name: 'headline',
      type: 'string',
      components: {diff: HeadlineDiff},
    }),
    defineType({
      name: 'publishAt',
      type: 'datetime',
    }),
    defineType({
      name: 'article',
      type: 'document',
      fields: [
        defineField({name: 'title', type: 'string'}),
        defineField({name: 'body', type: 'text'}),
        defineField({name: 'caption', type: 'headline'}),
        defineField({
          name: 'override',
          type: 'string',
          components: {diff: TitleDiff},
        }),
        defineField({name: 'published', type: 'boolean'}),
        defineField({name: 'count', type: 'number'}),
        defineField({name: 'born', type: 'date'}),
        defineField({name: 'publishedAt', type: 'datetime'}),
        defineField({name: 'when', type: 'publishAt'}),
        defineField({name: 'slug', type: 'slug'}),
        defineField({name: 'author', type: 'reference', to: [{type: 'article'}]}),
        defineField({name: 'photo', type: 'image'}),
        defineField({name: 'attachment', type: 'file'}),
        defineField({
          name: 'blocks',
          type: 'array',
          of: [{type: 'block'}],
        }),
        defineField({
          name: 'tags',
          type: 'array',
          of: [{type: 'string'}],
        }),
        defineField({
          name: 'authorCard',
          type: 'object',
          fields: [defineField({name: 'name', type: 'string'})],
        }),
      ],
    }),
  ],
})

const article = schema.get('article') as ObjectSchemaType

function fieldType(name: string): SchemaType {
  const field = article.fields.find((member) => member.name === name)
  if (!field) {
    throw new Error(`Expected field ${name}`)
  }
  return field.type
}

describe('resolveDiffComponent', () => {
  it('uses the datetime component for date and datetime, not the string jsonType', () => {
    expect(resolveDiffComponent(fieldType('born'))).toBe(DatetimeFieldDiff)
    expect(resolveDiffComponent(fieldType('publishedAt'))).toBe(DatetimeFieldDiff)
    expect(resolveDiffComponent(fieldType('title'))).toBe(StringFieldDiff)
  })

  it('walks the type chain so a datetime alias and a text field still hit the builtin defaults', () => {
    expect(resolveDiffComponent(fieldType('when'))).toBe(DatetimeFieldDiff)
    expect(resolveDiffComponent(fieldType('body'))).toBe(StringFieldDiff)
  })

  it('prefers components.diff on the schema type over the builtin default', () => {
    expect(resolveDiffComponent(fieldType('caption'))).toBe(HeadlineDiff)
    expect(resolveDiffComponent(fieldType('override'))).toBe(TitleDiff)
  })

  it('returns boolean options that hide the field header, and the number default', () => {
    expect(resolveDiffComponent(fieldType('published'))).toEqual({
      component: BooleanFieldDiff,
      showHeader: false,
    })
    expect(resolveDiffComponent(fieldType('count'))).toBe(NumberFieldDiff)
  })

  it('resolves slug, image, file and reference by type name, not object jsonType', () => {
    expect(resolveDiffComponent(fieldType('slug'))).toBe(SlugFieldDiff)
    expect(resolveDiffComponent(fieldType('author'))).toBe(ReferenceFieldDiff)
    expect(resolveDiffComponent(fieldType('photo'))).toBe(ImageFieldDiff)
    expect(resolveDiffComponent(fieldType('attachment'))).toBe(FileFieldDiff)
  })

  it('has no default for object and array types', () => {
    expect(resolveDiffComponent(fieldType('authorCard'))).toBeUndefined()
    expect(resolveDiffComponent(fieldType('tags'))).toBeUndefined()
  })

  it('resolves a portable text block member from the array of-type', () => {
    const tags = fieldType('tags')
    const blocks = fieldType('blocks')
    if (tags.jsonType !== 'array' || blocks.jsonType !== 'array') {
      throw new Error('Expected array fields')
    }

    expect(resolveDiffComponent(tags.of[0], tags)).toBe(StringFieldDiff)
    expect(resolveDiffComponent(blocks.of[0], blocks)).toBe(PTDiff)
  })
})
