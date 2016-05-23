export default {
  name: 'example-blog',
  types: {
    blogpost: {
      type: 'object',
      fields: {
        title: {
          title: 'Title',
          type: 'string'
        },
        lead: {
          title: 'Lead',
          type: 'text'
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
    },
    image: {
      type: 'object',
      fields: {
        fullsize: {type: 'string'},
        aspectRatio: {type: 'number'},
        versions: {
          type: 'array',
          of: [{type: 'imageVersion'}]
        }
      }
    },
    imageVersion: {
      type: 'object',
      fields: {
        width: {type: 'number'},
        square: {type: 'boolean'},
        url: {type: 'string'}
      }
    }
  }
}
