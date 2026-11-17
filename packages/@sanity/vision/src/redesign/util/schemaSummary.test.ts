import {Schema} from '@sanity/schema'
import {describe, expect, it} from 'vitest'

import {summarizeSchema} from './schemaSummary'

const schema = Schema.compile({
  name: 'test',
  types: [
    {
      name: 'author',
      type: 'document',
      title: 'Author',
      fields: [
        {name: 'firstName', type: 'string'},
        {name: 'lastName', type: 'string'},
        {
          name: 'role',
          type: 'string',
          options: {list: ['writer', {title: 'Editor', value: 'editor'}]},
        },
        {name: 'bestFriend', type: 'reference', to: [{type: 'author'}]},
        {name: 'books', type: 'array', of: [{type: 'reference', to: [{type: 'book'}]}]},
        {name: 'seo', type: 'seo'},
        {name: 'bio', type: 'array', of: [{type: 'block'}]},
        {
          name: 'address',
          type: 'object',
          fields: [
            {name: 'city', type: 'string'},
            {name: 'geo', type: 'object', fields: [{name: 'lat', type: 'number'}]},
          ],
        },
      ],
    },
    {
      name: 'seo',
      type: 'object',
      fields: [
        {name: 'title', type: 'string'},
        {name: 'keywords', type: 'array', of: [{type: 'string'}]},
      ],
    },
    {name: 'book', type: 'document', fields: [{name: 'title', type: 'string'}]},
    {
      name: 'blogPost',
      type: 'document',
      title: 'Blog post',
      fields: [{name: 'title', type: 'string'}],
    },
  ],
})

describe('summarizeSchema', () => {
  it('describes the fields of the types the request is about and names the others', () => {
    expect(summarizeSchema(schema, 'The 10 most recent authors by last name').split('\n')).toEqual([
      '- author (Author): firstName: string, lastName: string, role: string (one of "writer", "editor"), bestFriend: reference to author, books: array of reference to book, seo: seo {title: string, keywords: array of string}, bio: Portable Text (array of blocks), address: object {city: string, geo: object}',
      'Other document types: blogPost, book',
    ])
  })

  it('matches a type by its title and by every word of a camel-cased name', () => {
    expect(summarizeSchema(schema, 'blog posts from last week').split('\n')[0]).toBe(
      '- blogPost (Blog post): title: string',
    )
  })

  it('only names the types when the request mentions none of them', () => {
    expect(summarizeSchema(schema, 'everything changed today')).toBe(
      'Document types: author, blogPost, book',
    )
  })
})
