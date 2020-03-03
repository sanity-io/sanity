export default {
  name: 'zoo',
  type: 'document',
  title: 'Zoo',
  description: 'A document type for testing visualizing diffs. Why not a zoo?',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string'
    },
    {
      name: 'keeper',
      title: 'Keeper',
      type: 'object',
      description: 'The zoo-keeper is an important figure',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string'
        },
        {
          name: 'age',
          title: 'Age',
          type: 'number'
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
        }
      ]
    },
    {
      name: 'giraffe',
      title: 'Giraffe',
      type: 'object',
      description: 'There is a single giraffe in the zoo, and this is the one',
      fields: [
        {
          name: 'age',
          title: 'Age',
          type: 'number'
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
              name: 'hasFamousSpots',
              title: 'Famous Spots',
              type: 'boolean',
              description: 'Have the spots on this giraffe ever made it on the cover of magazine?'
            }
          ]
        },
        {
          name: 'image',
          title: 'Image',
          type: 'image',
          options: {hotspot: true}
        }
      ]
    },
    {
      name: 'neighbour',
      title: 'Neighbouring zoo',
      type: 'reference',
      to: [{type: 'zoo'}],
      description: 'Believe it or not, there is another zoo next door'
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
    },
    {
      name: 'description',
      title: 'Description of the zoo',
      type: 'array',
      of: [{type: 'block'}, {type: 'image'}]
    }
  ]
}
