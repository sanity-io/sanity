export default {
  name: 'sanity.fileAsset',
  title: 'File',
  type: 'document',
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
      title: 'Original file name',
      readOnly: true
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
      fieldset: 'system'
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
      size: 'size'
    },
    prepare(doc) {
      return {
        title: doc.title || doc.path.split('/').slice(-1)[0],
        subtitle: `${doc.mimeType} (${(doc.size / 1024 / 1024).toFixed(2)} MB)`
      }
    }
  },
  orderings: [
    {
      title: 'File size',
      name: 'fileSizeDesc',
      by: [{field: 'size', direction: 'desc'}]
    }
  ]
}
