export default {
  name: 'sanity.fileAsset',
  title: 'File',
  type: 'object',
  fieldsets: [
    {
      name: 'system',
      title: 'System fields',
      description: 'These are read only'
    }
  ],
  fields: [
    {
      name: 'originalFilename',
      type: 'string',
      title: 'Original file name'
    },
    {
      name: 'extension',
      type: 'string',
      title: 'File extension'
    },
    {
      name: 'mimeType',
      type: 'string',
      title: 'Mime type'
    },
    {
      name: 'label',
      type: 'string',
      title: 'Label'
    },
    {
      name: 'size',
      type: 'number',
      title: 'File size in bytes',
      readOnly: true,
      fieldset: 'system',
    },
    {
      name: 'assetId',
      type: 'string',
      title: 'Asset ID',
      readOnly: true,
      fieldset: 'system'
    },
    {
      name: 'path',
      type: 'string',
      title: 'Path',
      readOnly: true,
      fieldset: 'system'
    },
    {
      name: 'url',
      type: 'string',
      title: 'Url',
      readOnly: true,
      fieldset: 'system'
    }
  ],
  preview: {
    select: {
      title: 'originalFilename'
    }
  }
}
