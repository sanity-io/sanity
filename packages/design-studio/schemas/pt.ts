const objectExample = {
  type: 'object',
  name: 'objectExample',
  title: 'Object (1)',
  fields: [{type: 'string', name: 'title', title: 'Title'}]
}

const imageExample = {
  type: 'image',
  name: 'imageExample',
  title: 'Image example',
  options: {
    hotspot: true
  }
}

const pt = {
  type: 'array',
  name: 'pt',
  title: 'Portable text',
  of: [
    {
      type: 'block',
      of: [{...objectExample, validation: Rule => Rule.required()}],
      marks: {
        annotations: [
          {
            type: 'object',
            name: 'link',
            fields: [
              {
                type: 'string',
                name: 'href',
                title: 'URL',
                validation: Rule => Rule.required()
              }
            ]
          },
          objectExample
        ]
      }
    },
    imageExample,
    objectExample
  ]
}

const arrayWithPt = {
  type: 'array',
  name: 'arrayWithPt',
  title: 'Array with Portable Text',
  of: [
    {
      type: 'object',
      name: 'objectWithPT',
      title: 'Object with PT',
      fields: [
        {type: 'string', name: 'title', title: 'Title'},
        {type: 'array', name: 'pt', title: 'Portable Text', of: [{type: 'block'}]}
      ]
    }
  ]
}

export default {
  type: 'document',
  name: 'pt',
  title: 'Portable Text™',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title'
    },
    pt,
    arrayWithPt
  ]
}
