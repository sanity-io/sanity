import {type SchemaType} from 'groq-js'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {createSchema} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {getGroqSchema} from '../src/redesign/util/typegen/evaluateQueryType'

export const STATUSES = ['draft', 'review', 'published']

export const documentTypes = ['author', 'category', 'pokemon', 'post']

/** The schema the param inference tests read field types from, compiled the way Studio does it. */
export const schema: SchemaType = getGroqSchema(
  createSchema({
    name: 'params',
    types: [
      defineType({
        name: 'post',
        type: 'document',
        fields: [
          defineField({name: 'title', type: 'string'}),
          defineField({name: 'slug', type: 'slug'}),
          defineField({name: 'status', type: 'string', options: {list: STATUSES}}),
          defineField({name: 'views', type: 'number'}),
          defineField({name: 'featured', type: 'boolean'}),
          defineField({name: 'publishedAt', type: 'datetime'}),
          defineField({name: 'tags', type: 'array', of: [defineArrayMember({type: 'string'})]}),
          defineField({name: 'author', type: 'reference', to: [{type: 'author'}]}),
          defineField({
            name: 'categories',
            type: 'array',
            of: [defineArrayMember({type: 'reference', to: [{type: 'category'}]})],
          }),
          defineField({name: 'location', type: 'geopoint'}),
          defineField({name: 'body', type: 'array', of: [defineArrayMember({type: 'block'})]}),
        ],
      }),
      defineType({
        name: 'author',
        type: 'document',
        fields: [defineField({name: 'name', type: 'string'})],
      }),
      defineType({
        name: 'category',
        type: 'document',
        fields: [defineField({name: 'title', type: 'string'})],
      }),
      defineType({
        name: 'pokemon',
        type: 'document',
        fields: [
          defineField({name: 'name', type: 'string'}),
          defineField({name: 'description', type: 'text'}),
          defineField({
            name: 'generation',
            type: 'reference',
            to: [{type: 'pokemonGeneration'}],
          }),
        ],
      }),
      defineType({
        name: 'pokemonGeneration',
        type: 'document',
        fields: [defineField({name: 'name', type: 'string'})],
      }),
    ],
  }),
)
