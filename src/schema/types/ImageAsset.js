export default {
  name: 'imageAsset',
  type: 'object',
  fields: [
    {
      name: 'baseurl',
      type: 'url',
      title: 'Base URL'
    },
    {
      name: 'aspectRatio',
      type: 'number',
      title: 'Aspect Ratio'
    },
    {
      name: 'originalPath',
      type: 'string',
      title: 'Original Path'
    },
    {
      name: 'versions',
      type: 'array',
      of: [{type: 'imageVersion'}]
    }
  ]
}
