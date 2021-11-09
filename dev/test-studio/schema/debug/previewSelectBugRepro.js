export const previewSelectBugRepro = {
  name: 'previewSelectBugRepro',
  type: 'document',
  title: 'Preview selection bug repro',
  description:
    'Reproduction case for a bug in preview selection that caused invalid query when targeting both a reference field and fields on the referenced document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {name: 'book', type: 'reference', to: [{type: 'book'}]},
  ],
  preview: {
    select: {
      title: 'title',
      hasBook: 'book',
      bookRef: 'book._ref',
      bookId: 'book._id',
      bookTitle: 'book.title',
    },
    prepare(selection) {
      return {
        title: selection.title,
        subtitle: `Book: ${selection.hasBook ? selection.bookTitle : '(no book)'}`,
      }
    },
  },
}
