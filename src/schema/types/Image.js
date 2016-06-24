export default {
  name: 'image',
  type: 'object',
  fields: [
    {
      name: 'asset',
      type: 'reference',
      to: [{type: 'imageAsset'}],
      title: 'Media'
    },
    {
      name: 'hotspot',
      type: 'object',
      fields: [
        {
          name: 'x',
          type: 'number'
        },
        {
          name: 'y',
          type: 'number'
        },
        {
          name: 'height',
          type: 'number'
        },
        {
          name: 'width',
          type: 'number'
        }
      ]
    },
    {
      name: 'crop',
      type: 'object',
      fields: [
        {
          name: 'top',
          type: 'number'
        },
        {
          name: 'bottom',
          type: 'number'
        },
        {
          name: 'left',
          type: 'number'
        },
        {
          name: 'right',
          type: 'number'
        }
      ]
    },
    {
      name: 'caption',
      type: 'string'
    },
    {
      name: 'altText',
      type: 'string'
    },
    {
      name: 'license',
      type: 'string'
    }
  ]
}