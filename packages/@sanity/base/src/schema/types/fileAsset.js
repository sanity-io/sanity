export default {
  name: 'sanity.fileAsset',
  title: 'File',
  type: 'object',
  fieldsets: [
    {
      name: 'system',
      title: 'System fields',
      description: 'These fields are managed by the system and not editable'
    }
  ],
  fields: [
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
      name: 'extension',
      type: 'string',
      title: 'File extension',
      readOnly: true,
      fieldset: 'system'
    },
    {
      name: 'mimeType',
      type: 'string',
      title: 'Mime type',
      readOnly: true,
      fieldset: 'system'
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
      title: 'originalFilename',
      path: 'path',
      mimeType: 'mimeType',
    },
    prepare(doc) {
      return {
        title: doc.title || doc.path.split('/').slice(-1)[0],
        subtitle: doc.mimeType
      }
    }
  }
}
