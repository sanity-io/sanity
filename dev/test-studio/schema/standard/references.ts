import {SyncIcon} from '@sanity/icons'
import {defineField, defineType, type ReferenceFilterResolverContext} from 'sanity'

export const referenceAlias = defineType({
  type: 'reference',
  name: 'reference-alias',
  title: 'Reference alias',
  description: 'This is a reference alias type',
  to: {type: 'referenceTest'},
})

export default defineType({
  name: 'referenceTest',
  type: 'document',
  title: 'Reference test',
  description: 'Test cases for references',
  icon: SyncIcon,
  fields: [
    {name: 'title', type: 'string'},
    {
      name: 'selfRef',
      title: 'Reference to self',
      type: 'reference',
      description: 'Some description',
      to: {type: 'referenceTest'},
      readOnly: () => true,
    },
    {
      name: 'selfOrEmpty',
      title: 'Reference to either self or empty',
      type: 'reference',
      description: 'Some description',
      to: [{type: 'referenceTest'}, {type: 'empty'}],
    },
    {
      name: 'aliasRef',
      type: referenceAlias.name,
    },
    {
      title: 'Reference to book or author',
      name: 'multiTypeRef',
      type: 'reference',
      to: [{type: 'book'}, {type: 'author'}],
    },
    {
      name: 'array',
      type: 'array',
      title: 'Array of refs and inline objects',
      of: [
        {type: 'empty', title: 'Inline object'},
        {type: 'book', title: 'Inline book'},
        {
          type: 'reference',
          title: 'Reference to either "species", "empty" or "book"',
          description: 'Some description',
          to: [{type: 'species'}, {type: 'empty'}, {type: 'book'}, {type: 'referenceTest'}],
        },
      ],
    },
    {name: 'liveEditedDocument', type: 'reference', to: {type: 'thesis'}},
    defineField({
      title: 'Book with decade filter',
      description: 'Reference will only search for books within given decade',
      name: 'filtered',
      type: 'object',
      validation: (Rule) =>
        Rule.custom<{decade?: number}>((val) =>
          !val || val.decade ? true : 'Must have decade defined',
        ),
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
    {
      name: 'arrayWithDisableCreateNew',
      type: 'array',
      title: 'Array of refs with disabled create button',
      of: [
        {
          type: 'reference',
          title: 'Reference to either "species" or "empty" document',
          description: 'Some description',
          options: {disableNew: true},
          to: [{type: 'species'}, {type: 'empty'}],
        },
      ],
    },
    {
      name: 'portableTextWithReferences',
      type: 'array',
      of: [
        {
          type: 'block',
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [
              {
                name: 'Author',
                title: 'Author reference',
                type: 'reference',
                to: [{type: 'author'}],
              },
            ],
          },
          of: [
            {
              type: 'reference',
              title: 'Author reference',
              to: [{type: 'author'}],
            },
          ],
        },
        {
          type: 'reference',
          title: 'Author',
          to: [{type: 'author'}],
        },
        {type: 'empty'},
      ],
    },
    {
      name: 'referenceWithDisabledCreateNew',
      type: 'reference',
      title: 'Reference to either "species" or "empty" document with disabled create button',
      description: 'Some description',
      options: {disableNew: true},
      to: [{type: 'species'}, {type: 'empty'}],
    },
    {
      name: 'invalidFilter',
      title: 'Invalid filter',
      description: 'This will error when trying to search for anything',
      type: 'reference',
      to: {type: 'book'},
      options: {
        filter: '&',
      },
    },
    {
      name: 'asyncFilter',
      title: 'Async filter',
      type: 'reference',
      to: [{type: 'book'}],
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
    {
      name: 'refToTypeWithNoToplevelStrings',
      type: 'reference',
      to: {type: 'typeWithNoToplevelStrings'},
    },
    {
      name: 'someStrongRef',
      title: 'Strong reference (default)',
      type: 'reference',
      to: {type: 'author'},
    },
    {
      name: 'someWeakRef',
      title: 'Weak reference',
      type: 'reference',
      weak: true,
      to: {type: 'author'},
    },
    {
      name: 'anotherWeakRef',
      title: 'Another weak reference',
      type: 'reference',
      weak: true,
      to: {type: 'author'},
    },
    {
      name: 'arrayOfCustomReferences',
      type: 'array',
      of: [
        {
          type: 'reference',
          name: 'strongAuthorRef',
          title: 'A strong author ref',
          to: {type: 'author'},
        },
        {
          type: 'reference',
          name: 'weakAuthorRef',
          title: 'A weak author ref',
          weak: true,
          to: {type: 'author'},
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      author0: 'array.0.name',
      author1: 'array.1.name',
    },
    prepare(val) {
      return {
        title: val.title,
        subtitle: [val.author0, val.author1].filter(Boolean).join(', '),
      }
    },
  },
})
