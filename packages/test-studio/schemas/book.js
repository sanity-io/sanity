function formatSubtitle(book) {
  if (book.authorName && book.publicationYear) {
    return `By ${book.authorName} (${book.publicationYear})`
  }
  return book.authorName ? `By ${book.authorName}` : String(book.publicationYear || '')
}

export default {
  name: 'book',
  type: 'document',
  title: 'Book',
  description: 'This is just a simple type for generating some test data',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'translations',
      title: 'Translations',
      type: 'object',
      fields: [
        {name: 'no', type: 'string', title: 'Norwegian (Bokmål)'},
        {name: 'nn', type: 'string', title: 'Norwegian (Nynorsk)'},
        {name: 'se', type: 'string', title: 'Swedish'}
      ]
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: {type: 'author', title: 'Author'}
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image'
    },
    {
      name: 'publicationYear',
      title: 'Year of publication',
      type: 'number'
    },
    {
      name: 'isbn',
      title: 'ISBN number',
      description: 'ISBN-number of the book. Not shown in studio.',
      type: 'number',
      hidden: true
    }
  ],
  orderings: [
    {
      title: 'Title',
      name: 'title',
      by: [
        {field: 'title', direction: 'asc'},
        {field: 'publicationYear', direction: 'asc'}
      ]
    },
    {
      title: 'Swedish title',
      name: 'swedishTitle',
      by: [
        {field: 'translations.se', direction: 'asc'},
        {field: 'title', direction: 'asc'}
      ]
    }
  ],
  preview: {
    select: {
      title: 'title',
      translations: 'translations',
      createdAt: '_createdAt',
      date: '_updatedAt',
      authorName: 'author.name',
      publicationYear: 'publicationYear',
      media: 'coverImage'
    },
    prepare(book, options = {}) {
      return Object.assign({}, book, {
        title: ((options.ordering || {}).name === 'swedishTitle' && (book.translations || {}).se) || book.title,
        subtitle: formatSubtitle(book)
      })
    }
  }
}
