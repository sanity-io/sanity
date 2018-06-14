const PALETTE_FIELDS = [
  {name: 'background', type: 'string', title: 'Background', readOnly: true},
  {name: 'foreground', type: 'string', title: 'Foreground', readOnly: true},
  {name: 'population', type: 'number', title: 'Population', readOnly: true},
  {name: 'title', type: 'string', title: 'String', readOnly: true}
]

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
      type: 'object',
      title: 'Metadata',
      fieldsets: [
        {
          name: 'extra',
          title: 'Extra metadata…',
          options: {
            collapsable: true
          }
        }
      ],
      fields: [
        {
          name: 'location',
          type: 'geopoint'
        },
        {
          name: 'dimensions',
          type: 'object',
          title: 'Dimensions',
          fields: [
            {name: 'height', type: 'number', title: 'Height', readOnly: true},
            {name: 'width', type: 'number', title: 'Width', readOnly: true},
            {name: 'aspectRatio', type: 'number', title: 'Aspect ratio', readOnly: true}
          ],
          fieldset: 'extra'
        },
        {
          name: 'palette',
          type: 'object',
          title: 'Palette',
          fields: [
            {name: 'darkMuted', type: 'object', title: 'Dark Muted', fields: PALETTE_FIELDS},
            {name: 'lightVibrant', type: 'object', title: 'Light Vibrant', fields: PALETTE_FIELDS},
            {name: 'darkVibrant', type: 'object', title: 'Dark Vibrant', fields: PALETTE_FIELDS},
            {name: 'vibrant', type: 'object', title: 'Vibrant', fields: PALETTE_FIELDS},
            {name: 'dominant', type: 'object', title: 'Dominant', fields: PALETTE_FIELDS},
            {name: 'lightMuted', type: 'object', title: 'Light Muted', fields: PALETTE_FIELDS},
            {name: 'muted', type: 'object', title: 'Muted', fields: PALETTE_FIELDS}
          ],
          fieldset: 'extra'
        },
        {
          name: 'lqip',
          title: 'LQIP (Low-Quality Image Placeholder)',
          type: 'string',
          readOnly: true
        }
      ]
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
