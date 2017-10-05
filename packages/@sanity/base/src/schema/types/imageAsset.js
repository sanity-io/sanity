const PALETTE_FIELDS = [
  {name: 'background', type: 'string', title: 'Background'},
  {name: 'foreground', type: 'string', title: 'Foreground'},
  {name: 'population', type: 'number', title: 'Population'},
  {name: 'title', type: 'string', title: 'String'},
]
export default {
  name: 'sanity.imageAsset',
  title: 'Image asset',
  type: 'object',
  fieldsets: [
    {
      name: 'system',
      title: 'System fields',
      description: 'These are read only'
    },
    {
      name: 'metadata',
      title: 'Extra metadata…',
      options: {
        collapsable: true
      }
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
      readOnly: true,
      fieldset: 'metadata',
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
            {name: 'height', type: 'number', title: 'Height'},
            {name: 'width', type: 'number', title: 'Width'},
            {name: 'aspectRatio', type: 'number', title: 'Aspect ratio'}
          ]
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
          ]
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'originalFilename',
      imageUrl: 'url'
    }
  }
}
