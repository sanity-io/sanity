export const requiredImageTypes = [
  {
    name: 'sanity.assetSourceData',
    title: 'Asset Source Data',
    type: 'object',
    fields: [
      {
        name: 'name',
        title: 'Source name',
        description: 'A canonical name for the source this asset is originating from',
        type: 'string',
      },
      {
        name: 'id',
        title: 'Asset Source ID',
        description:
          'The unique ID for the asset within the originating source so you can programatically find back to it',
        type: 'string',
      },
      {
        name: 'url',
        title: 'Asset information URL',
        description: 'A URL to find more information about this asset in the originating source',
        type: 'string',
      },
    ],
  },
  {
    name: 'sanity.imageCrop',
    title: 'Image crop',
    type: 'object',
    fields: [
      {
        name: 'top',
        type: 'number',
      },
      {
        name: 'bottom',
        type: 'number',
      },
      {
        name: 'left',
        type: 'number',
      },
      {
        name: 'right',
        type: 'number',
      },
    ],
  },
  {
    name: 'sanity.imageHotspot',
    title: 'Image hotspot',
    type: 'object',
    fields: [
      {
        name: 'x',
        type: 'number',
      },
      {
        name: 'y',
        type: 'number',
      },
      {
        name: 'height',
        type: 'number',
      },
      {
        name: 'width',
        type: 'number',
      },
    ],
  },
  {
    name: 'sanity.imageMetadata',
    title: 'Image metadata',
    type: 'object',
    fieldsets: [
      {
        name: 'extra',
        title: 'Extra metadata…',
        options: {
          collapsable: true,
        },
      },
    ],
    fields: [
      {
        name: 'location',
        type: 'geopoint',
      },
      {
        name: 'dimensions',
        title: 'Dimensions',
        type: 'sanity.imageDimensions',
        fieldset: 'extra',
      },
      {
        name: 'palette',
        type: 'sanity.imagePalette',
        title: 'Palette',
        fieldset: 'extra',
      },
      {
        name: 'lqip',
        title: 'LQIP (Low-Quality Image Placeholder)',
        type: 'string',
        readOnly: true,
      },
      {
        name: 'blurHash',
        title: 'BlurHash',
        type: 'string',
        readOnly: true,
      },
      {
        name: 'hasAlpha',
        title: 'Has alpha channel',
        type: 'boolean',
        readOnly: true,
      },
      {
        name: 'isOpaque',
        title: 'Is opaque',
        type: 'boolean',
        readOnly: true,
      },
    ],
  },
  {
    name: 'sanity.imageDimensions',
    type: 'object',
    title: 'Image dimensions',
    fields: [
      {name: 'height', type: 'number', title: 'Height', readOnly: true},
      {name: 'width', type: 'number', title: 'Width', readOnly: true},
      {name: 'aspectRatio', type: 'number', title: 'Aspect ratio', readOnly: true},
    ],
  },
  {
    name: 'sanity.imagePalette',
    title: 'Image palette',
    type: 'object',
    fields: [
      {name: 'darkMuted', type: 'sanity.imagePaletteSwatch', title: 'Dark Muted'},
      {name: 'lightVibrant', type: 'sanity.imagePaletteSwatch', title: 'Light Vibrant'},
      {name: 'darkVibrant', type: 'sanity.imagePaletteSwatch', title: 'Dark Vibrant'},
      {name: 'vibrant', type: 'sanity.imagePaletteSwatch', title: 'Vibrant'},
      {name: 'dominant', type: 'sanity.imagePaletteSwatch', title: 'Dominant'},
      {name: 'lightMuted', type: 'sanity.imagePaletteSwatch', title: 'Light Muted'},
      {name: 'muted', type: 'sanity.imagePaletteSwatch', title: 'Muted'},
    ],
  },
  {
    name: 'sanity.imagePaletteSwatch',
    title: 'Image palette swatch',
    type: 'object',
    fields: [
      {name: 'background', type: 'string', title: 'Background', readOnly: true},
      {name: 'foreground', type: 'string', title: 'Foreground', readOnly: true},
      {name: 'population', type: 'number', title: 'Population', readOnly: true},
      {name: 'title', type: 'string', title: 'String', readOnly: true},
    ],
  },
]
