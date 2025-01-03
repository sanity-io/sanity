import {defineField, defineType, type ReferenceFilterResolverContext} from '@sanity/types'

import {eventsArray} from '../objects'

export const referencesDocument = defineType({
  name: 'referencesDocument',
  title: 'References',
  type: 'document',
  fields: [
    eventsArray,
    defineField({
      name: 'arrayOfReferences',
      title: 'Array of references to editors',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'editor'}]}],
    }),
    defineField({
      name: 'reference',
      title: 'Reference to editor',
      type: 'reference',
      to: [{type: 'editor'}],
    }),
    defineField({
      name: 'referenceWithFilter',
      title: 'Reference to editor with filter',
      type: 'reference',
      to: [{type: 'editor'}],
      options: {
        filter: 'name == "yyy"',
      },
    }),
    defineField({
      name: 'referenceWithFilterFunction',
      title: 'Reference to editor with filter function',
      type: 'reference',
      to: [{type: 'editor'}],
      options: {
        filter: 'name == "yyy"',
      },
    }),
    defineField({
      name: 'arrayOfReferencesWithFilter',
      title: 'Array of references to editors with filter',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'editor'}],
          options: {
            filter: 'name == yyy',
          },
        },
      ],
    }),
    defineField({
      title: 'Book with decade filter',
      description: 'Reference will only search for books within given decade',
      name: 'decadeFilteredBook',
      type: 'object',
      fields: [
        {
          title: 'Decade',
          description: 'eg. 1980, 1990, 2000',
          name: 'decade',
          type: 'number',
          validation: (Rule) =>
            Rule.required()
              .min(0)
              .max(3000)
              .custom<number>((year) => {
                return !year || year % 10 ? 'Must be a decade, eg use 1990 instead of 1994' : true
              }),
        },
        {
          name: 'book',
          title: 'Book reference',
          type: 'reference',
          to: {type: 'book'},
          options: {
            filter: ({parent}: {parent?: unknown[] | {decade?: number}}) => {
              const decade = Array.isArray(parent) ? null : parent?.decade
              if (!decade) {
                return {filter: 'false'} // && false always returns no results :)
              }

              const minYear = Math.floor(decade / 10) * 10
              const maxYear = minYear + 9

              return {
                filter: 'publicationYear >= $minYear && publicationYear <= $maxYear',
                params: {minYear, maxYear},
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'arrayOfReferencesWithAsyncFilter',
      title: 'Array of references to authors with filter',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'editor'}],
          options: {
            filter: async ({getClient}: ReferenceFilterResolverContext) => {
              const latestAuthorId = await getClient({apiVersion: '2023-01-01'}).fetch<string>(
                '*[_type == "author" && _id in path("*")] | order(_createdAt desc) [0]._id',
              )

              return Promise.resolve({
                filter: 'author._ref == $latestAuthorId',
                params: {latestAuthorId},
              })
            },
          },
        },
      ],
    }),
  ],
})
