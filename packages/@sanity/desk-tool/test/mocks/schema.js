const types = {
  author: author(),
  post: post()
}

module.exports = {
  name: 'blog',
  get: typeName => types[typeName],
  getTypeNames: () => Object.keys(types)
}

function author() {
  return {
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [
      {
        name: 'name',
        title: 'Name',
        type: 'string'
      },
      {
        name: 'slug',
        title: 'Slug',
        type: 'slug',
        options: {
          source: 'name',
          maxLength: 96
        }
      },
      {
        name: 'image',
        title: 'Image',
        type: 'image',
        options: {
          hotspot: true
        }
      }
    ],
    preview: {
      select: {
        title: 'name',
        media: 'image'
      }
    }
  }
}

function post() {
  return {
    name: 'post',
    title: 'Post',
    type: 'document',
    icon: () => null,
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string'
      },
      {
        name: 'slug',
        title: 'Slug',
        type: 'slug',
        options: {
          source: 'title',
          maxLength: 96
        }
      },
      {
        name: 'author',
        title: 'Author',
        type: 'reference',
        to: {type: 'author'}
      },
      {
        name: 'mainImage',
        title: 'Main image',
        type: 'image',
        options: {
          hotspot: true
        }
      },
      {
        name: 'publishedAt',
        title: 'Published at',
        type: 'datetime'
      },
      {
        name: 'publicationYear',
        title: 'Publication year',
        type: 'string'
      },
      {
        name: 'translations',
        title: 'Translations',
        type: 'object',
        fields: [
          {
            name: 'se',
            title: 'Swedish',
            type: 'string'
          },
          {
            name: 'no',
            title: 'Norwegian',
            type: 'string'
          }
        ]
      },
      {
        name: 'body',
        title: 'Body',
        type: 'text'
      }
    ],
    preview: {
      select: {
        title: 'title',
        author: 'author.name',
        media: 'mainImage'
      }
    },
    initialValue: {
      slug: {_type: 'slug', current: 'default-slug'}
    },
    orderings: [
      {
        title: 'Title',
        name: 'title',
        by: [{field: 'title', direction: 'asc'}, {field: 'publicationYear', direction: 'asc'}]
      },
      {
        title: 'Swedish title',
        name: 'swedishTitle',
        by: [{field: 'translations.se', direction: 'asc'}, {field: 'title', direction: 'asc'}]
      }
    ]
  }
}
