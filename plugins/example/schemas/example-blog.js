export default {
  name: 'example-blog',
  types: {
    blogpost: {
      type: 'object',
      displayField: 'author',
      fields: {
        title: {
          title: 'Title',
          type: 'string'
        },
        priority: {
          title: 'Priority',
          type: 'number'
        },
        lead: {
          title: 'Lead',
          type: 'text'
        },
        email: {
          title: 'Email',
          type: 'email'
        },
        content: {
          type: 'array',
          of: [
            {
              title: 'String',
              type: 'string'
            }
          ]
        },
        authors: {
          title: 'Authors',
          type: 'array',
          of: [
            {type: 'author'}
          ]
        }
      }
    },
    author: {
      type: 'object',
      fields: {
        name: {
          title: 'Title',
          type: 'string'
        },
        awards: {
          title: 'Awards',
          type: 'array',
          of: [
            {type: 'string'}
          ]
        }
      }
    }
  }
}
