import {BookIcon} from '@sanity/icons'
import {Rule} from '@sanity/types'

function formatSubtitle(book: any) {
  return [
    'By',
    book.authorName || '<unknown>',
    book.authorBFF && `[BFF ${book.authorBFF} 🤞]`,
    book.publicationYear && `(${book.publicationYear})`,
  ]
    .filter(Boolean)
    .join(' ')
}

export default {
  name: 'book',
  type: 'document',
  title: 'Book',
  description: 'This is just a simple type for generating some test data',
  icon: BookIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule: Rule) => rule.min(5).max(100),
    },
    // {
    //   type: 'markdown',
    //   name: 'descriptionMd',
    //   title: 'Description (markdown)',
    // },
    {
      name: 'translations',
      title: 'Translations',
      type: 'object',
      fields: [
        {name: 'no', type: 'string', title: 'Norwegian (Bokmål)'},
        {name: 'nn', type: 'string', title: 'Norwegian (Nynorsk)'},
        {name: 'se', type: 'string', title: 'Swedish'},
      ],
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: {type: 'author', title: 'Author'},
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {hotspot: true},
    },
    {
      name: 'publicationYear',
      title: 'Year of publication',
      type: 'number',
    },
    {
      name: 'isbn',
      title: 'ISBN number',
      description: 'ISBN-number of the book. Not shown in studio.',
      type: 'number',
      hidden: true,
    },
    // {
    //   name: 'reviews',
    //   title: 'Reviews',
    //   type: 'array',
    //   of: [{type: 'review'}],
    // },
    {
      name: 'reviewsInline',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'review',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule: Rule) => rule.required(),
            },
          ],
        },
      ],
    },
    {
      name: 'genre',
      title: 'Genre',
      type: 'string',
      options: {
        list: [
          {title: 'Fiction', value: 'fiction'},
          {title: 'Non Fiction', value: 'nonfiction'},
          {title: 'Poetry', value: 'poetry'},
        ],
      },
    },
  ],
  orderings: [
    {
      title: 'Title',
      name: 'title',
      by: [
        {field: 'title', direction: 'asc'},
        {field: 'publicationYear', direction: 'asc'},
      ],
    },
    {
      title: 'Author name',
      name: 'authorName',
      by: [{field: 'author.name', direction: 'asc'}],
    },
    {
      title: 'Authors best friend',
      name: 'authorBFF',
      by: [{field: 'author.bestFriend.name', direction: 'asc'}],
    },
    {
      title: 'Size of coverImage',
      name: 'coverImageSize',
      by: [{field: 'coverImage.asset.size', direction: 'asc'}],
    },
    {
      title: 'Swedish title',
      name: 'swedishTitle',
      by: [
        {field: 'translations.se', direction: 'asc'},
        {field: 'title', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      translations: 'translations',
      createdAt: '_createdAt',
      date: '_updatedAt',
      authorName: 'author.name',
      authorBFF: 'author.bestFriend.name',
      publicationYear: 'publicationYear',
      media: 'coverImage',
    },
    prepare(book: any, options: any = {}) {
      return Object.assign({}, book, {
        title:
          ((options.ordering || {}).name === 'swedishTitle' && (book.translations || {}).se) ||
          book.title,
        subtitle: formatSubtitle(book),
      })
    },
  },
  initialValue: {
    title: 'Foo',
  },
}
