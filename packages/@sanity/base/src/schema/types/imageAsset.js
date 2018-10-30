export default {
  name: 'sanity.imageAsset',
  title: 'Image',
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
      name: 'sha1hash',
      type: 'string',
      title: 'SHA1 hash',
      readOnly: true,
      fieldset: 'system'
    },
    {
      name: 'extension',
      type: 'string',
      readOnly: true,
      title: 'File extension',
      fieldset: 'system'
    },
    {
      name: 'mimeType',
      type: 'string',
      readOnly: true,
      title: 'Mime type',
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
    },
    {
      name: 'metadata',
      type: 'sanity.imageMetadata',
      title: 'Metadata'
    }
  ],
  preview: {
    select: {
      id: '_id',
      title: 'originalFilename',
      mimeType: 'mimeType',
      size: 'size'
    },
    prepare(doc) {
      return {
        title: doc.title || doc.path.split('/').slice(-1)[0],
        media: {asset: {_ref: doc.id}},
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
