export default {
  name: 'imageAsset',
  title: 'Image asset',
  type: 'object',
  fields: [
    {
      name: 'assetId',
      type: 'string',
      title: 'Asset ID'
    },
    {
      name: 'project',
      type: 'string',
      title: 'Project'
    },
    {
      name: 'label',
      type: 'string',
      title: 'Label'
    },
    {
      name: 'path',
      type: 'string',
      title: 'Path'
    },
    {
      name: 'url',
      type: 'string',
      title: 'Url'
    },
    {
      name: 'metadata',
      type: 'object',
      title: 'Metadata',
      fields: [
        {
          name: 'dimensions',
          type: 'object',
          title: 'Dimensions',
          fields: [
            {name: 'height', type: 'number', title: 'Height'},
            {name: 'width', type: 'number', title: 'Width'},
            {name: 'aspectRatio', type: 'number', title: 'Aspect ratio'}
          ]
        },
        {
          name: 'location',
          type: 'geopoint'
        }
      ]
    }
  ]
}
