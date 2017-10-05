export default {
  name: 'sanity.fileAsset',
  title: 'File asset',
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
      name: 'originalFilename',
      type: 'string',
      title: 'Original file name'
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
    }
  ]
}
