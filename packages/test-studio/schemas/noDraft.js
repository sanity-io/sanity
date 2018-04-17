import BookIcon from 'react-icons/lib/fa/book'

function formatSubtitle(thesis) {
  if (thesis.authorName && thesis.publicationYear) {
    return `By ${thesis.authorName} (${thesis.publicationYear})`
  }
  return thesis.authorName ? `By ${thesis.authorName}` : String(thesis.publicationYear || '')
}

export default {
  title: 'Thesis',
  name: 'thesis',
  type: 'document',
  draft: false,
  description: 'A simple type for testing draft: false',
  icon: BookIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
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
    }
  ],
  preview: {
    select: {
      title: 'title',
      authorName: 'author.name',
      publicationYear: 'publicationYear'
    },
    prepare(thesis, options = {}) {
      return Object.assign({}, thesis, {
        title: thesis.title,
        subtitle: formatSubtitle(thesis)
      })
    }
  }
}
