const objectsWithReference = {
  type: 'array',
  name: 'objectsWithReference',
  title: 'Objects with reference',
  of: [
    {
      type: 'object',
      name: 'objectWithReference',
      title: 'Object with reference',
      fields: [
        {type: 'string', name: 'title', title: 'Title'},
        {type: 'array', name: 'primitives', title: 'Primitives', of: [{type: 'string'}]},
        {type: 'text', name: 'description', title: 'Description', rows: 20},
        {type: 'reference', name: 'reference', title: 'Reference', to: [{type: 'book'}]},
      ],
    },
  ],
}

const arraysInArrays = {
  type: 'array',
  name: 'arraysInArrays',
  title: 'Arrays in arrays',
  of: [
    {
      type: 'object',
      name: 'object',
      title: 'Object',
      fields: [
        {
          type: 'string',
          name: 'title',
          title: 'Title',
        },
        {
          type: 'array',
          name: 'array',
          title: 'Arrays in arrays',
          of: [
            {
              type: 'object',
              name: 'object',
              title: 'Object',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
              ],
            },
            {
              type: 'object',
              name: 'object2',
              title: 'Object 2',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
              ],
            },
            {
              type: 'object',
              name: 'object3',
              title: 'Object 3',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
              ],
            },
            {
              type: 'object',
              name: 'object4',
              title: 'Object 4',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
              ],
            },
            {
              type: 'object',
              name: 'object5',
              title: 'Object 5',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
              ],
            },
            {
              type: 'object',
              name: 'object6',
              title: 'Object 6',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export default {
  type: 'document',
  name: 'poppers',
  title: 'Poppers',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
    {type: 'array', name: 'primitives', title: 'Primitives', of: [{type: 'string'}]},
    objectsWithReference,
    arraysInArrays,
  ],
}
