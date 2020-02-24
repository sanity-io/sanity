export default {
  name: 'diffTest',
  type: 'document',
  title: 'Diff Test',
  description: 'A document type for testing visualizing diffs',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}]
    },
    {
      name: 'face',
      title: 'Face',
      type: 'object',
      fields: [
        {
          name: 'nose',
          title: 'Nose',
          type: 'string',
          options: {layout: 'radio', list: ['Slim', 'Long', 'Red']}
        },
        {
          name: 'eyes',
          title: 'Eyes',
          type: 'number'
        },
        {
          name: 'hasFreckles',
          title: 'Freckles?',
          type: 'boolean'
        }
      ]
    },
    {
      name: 'friend',
      title: 'Friend',
      type: 'reference',
      to: [{type: 'author'}]
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        {
          name: 'caption',
          title: 'Caption',
          type: 'string',
          options: {
            isHighlighted: true
          }
        },
        {
          name: 'attribution',
          title: 'Attribution',
          type: 'string'
        }
      ]
    }
  ]
}
