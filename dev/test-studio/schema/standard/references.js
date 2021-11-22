import icon from 'part:@sanity/base/sync-icon'

export default {
  name: 'referenceTest',
  type: 'document',
  title: 'Reference test',
  description: 'Test cases for references',
  icon,
  fields: [
    {name: 'title', type: 'string'},
    {
      name: 'selfRef',
      title: 'Reference to self',
      type: 'reference',
      description: 'Some description',
      to: {type: 'referenceTest'},
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
          title: 'Reference to either "species" or "empty" document',
          description: 'Some description',
          to: [{type: 'species'}, {type: 'empty'}],
        },
      ],
    },
    {name: 'liveEditedDocument', type: 'reference', to: {type: 'thesis'}},
    {
      title: 'Book with decade filter',
      description: 'Reference will only search for books within given decade',
      name: 'filtered',
      type: 'object',
      validation: (Rule) =>
        Rule.custom((val) => (!val || val.decade ? true : 'Must have decade defined')),
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
              .custom((year) => {
                return year % 10 ? 'Must be a decade, eg use 1990 instead of 1994' : true
              }),
        },
        {
          name: 'book',
          title: 'Book reference',
          type: 'reference',
          to: {type: 'book'},
          options: {
            filter: (options) => {
              const decade = options.parent && options.parent.decade
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
    },
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
      to: {type: 'book'},
      options: {
        filter: () =>
          Promise.resolve({filter: '$param == "something"', params: {param: 'something'}}),
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
    fields: {
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
}
