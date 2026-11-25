import {createSchema, defineField, defineType} from 'sanity'
import {describe, expect, it} from 'vitest'

import {
  describeDocumentListFields,
  getAvailableRowFields,
  getDocumentListFields,
  selectPathToGroq,
} from './documentListFields'

const schema = createSchema({
  name: 'test',
  types: [
    defineType({
      name: 'person',
      type: 'document',
      fields: [
        defineField({name: 'name', type: 'string'}),
        defineField({name: 'slug', type: 'slug'}),
        defineField({name: 'bestFriend', type: 'reference', to: [{type: 'person'}]}),
        defineField({name: 'heroImage', type: 'image'}),
        defineField({name: 'avatar', type: 'image'}),
      ],
      preview: {select: {title: 'name', subtitle: 'slug', media: 'heroImage'}},
    }),
    defineType({
      name: 'book',
      type: 'document',
      fields: [
        defineField({name: 'title', type: 'string'}),
        defineField({name: 'author', type: 'reference', to: [{type: 'person'}]}),
        defineField({name: 'coverImage', type: 'image'}),
        defineField({name: 'publicationYear', type: 'number'}),
        defineField({name: 'summary', type: 'array', of: [{type: 'block'}]}),
        defineField({
          name: 'editors',
          type: 'array',
          of: [{type: 'reference', to: [{type: 'person'}]}],
        }),
      ],
      preview: {
        select: {
          title: 'title',
          authorName: 'author.name',
          authorFriend: 'author.bestFriend.name',
          firstEditor: 'editors.0.name',
          year: 'publicationYear',
          summary: 'summary',
          createdAt: '_createdAt',
          author: 'author',
          media: 'coverImage',
        },
      },
    }),
    defineType({
      name: 'article',
      type: 'document',
      fields: [
        defineField({name: 'headline', type: 'string'}),
        defineField({name: 'mainImage', type: 'image'}),
      ],
    }),
    defineType({
      name: 'setting',
      type: 'document',
      fields: [
        defineField({name: 'title', type: 'string'}),
        defineField({name: 'enabled', type: 'boolean'}),
      ],
    }),
  ],
})

function typeNamed(name: string) {
  const type = schema.get(name)
  if (!type) throw new Error(`No type ${name}`)
  return type
}

describe('selectPathToGroq', () => {
  it('follows references with an arrow and array positions with an index', () => {
    const book = typeNamed('book')
    expect(selectPathToGroq(book, 'author.bestFriend.name').expression).toBe(
      'author->bestFriend->name',
    )
    expect(selectPathToGroq(book, 'editors.0.name').expression).toBe('editors[0]->name')
    expect(selectPathToGroq(book, 'title').expression).toBe('title')
  })

  it('keeps a path the schema does not know as written', () => {
    const resolved = selectPathToGroq(typeNamed('book'), 'missing.path')
    expect(resolved.expression).toBe('missing.path')
    expect(resolved.type).toBeUndefined()
  })
})

describe('getDocumentListFields', () => {
  it('reads the title, the subtitle fields and the image from a declared preview', () => {
    expect(getDocumentListFields(schema, 'book')).toEqual({
      type: 'book',
      title: 'title',
      subtitle: [
        'author->name',
        'author->bestFriend->name',
        'editors[0]->name',
        'string(publicationYear)',
      ],
      media: 'coverImage',
    })
  })

  it('reads slugs as text and prefers a thumbnail over a hero image', () => {
    expect(getDocumentListFields(schema, 'person')).toEqual({
      type: 'person',
      title: 'name',
      subtitle: ['slug.current'],
      media: 'avatar',
    })
  })

  it('reads the preview the schema guesses for a type without one', () => {
    expect(getDocumentListFields(schema, 'article')).toEqual({
      type: 'article',
      title: 'headline',
      subtitle: [],
      media: 'mainImage',
    })
  })

  it('leaves media out for a type without images', () => {
    expect(getDocumentListFields(schema, 'setting').media).toBeUndefined()
  })
})

describe('describeDocumentListFields', () => {
  it('describes the row attributes of each type on a line', () => {
    expect(describeDocumentListFields(schema, ['book', 'setting']).split('\n')).toEqual([
      'The row attributes of those document types, from their previews:',
      '- book: "title": title; "subtitle" combining author->name, author->bestFriend->name, editors[0]->name, string(publicationYear); "media": coverImage',
      '- setting: "title": title; no image, so leave "media" out',
    ])
  })

  it('is empty for no types', () => {
    expect(describeDocumentListFields(schema, [])).toBe('')
  })
})

describe('getAvailableRowFields', () => {
  it('reports what the previews of the types can give a row', () => {
    expect(getAvailableRowFields(schema, ['setting'])).toEqual({
      title: true,
      subtitle: false,
      media: false,
    })
    expect(getAvailableRowFields(schema, ['setting', 'article'])).toEqual({
      title: true,
      subtitle: false,
      media: true,
    })
  })

  it('assumes every attribute when no type is known', () => {
    expect(getAvailableRowFields(schema, [])).toEqual({title: true, subtitle: true, media: true})
    expect(getAvailableRowFields(schema, ['missing'])).toEqual({
      title: true,
      subtitle: true,
      media: true,
    })
  })
})
