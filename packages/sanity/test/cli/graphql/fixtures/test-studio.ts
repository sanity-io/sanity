import {Schema} from '@sanity/schema'

export default Schema.compile({
  types: [
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
      title: 'Slug',
      name: 'slug',
      type: 'object',
      fields: [
        {
          name: 'current',
          title: 'Current slug',
          type: 'string',
        },
      ],
    },
    {
      title: 'Geographical Point',
      name: 'geopoint',
      type: 'object',
      fields: [
        {
          name: 'lat',
          type: 'number',
          title: 'Latitude',
        },
        {
          name: 'lng',
          type: 'number',
          title: 'Longitude',
        },
        {
          name: 'alt',
          type: 'number',
          title: 'Altitude',
        },
      ],
    },
    {
      name: 'sanity.imageAsset',
      title: 'Image',
      type: 'document',
      fieldsets: [
        {
          name: 'system',
          title: 'System fields',
          description: 'These fields are managed by the system and not editable',
        },
      ],
      fields: [
        {
          name: 'originalFilename',
          type: 'string',
          title: 'Original file name',
          readOnly: true,
        },
        {
          name: 'label',
          type: 'string',
          title: 'Label',
        },
        {
          name: 'title',
          type: 'string',
          title: 'Title',
        },
        {
          name: 'description',
          type: 'string',
          title: 'Description',
        },
        {
          name: 'altText',
          type: 'string',
          title: 'Alternative text',
        },
        {
          name: 'sha1hash',
          type: 'string',
          title: 'SHA1 hash',
          readOnly: true,
          fieldset: 'system',
        },
        {
          name: 'extension',
          type: 'string',
          readOnly: true,
          title: 'File extension',
          fieldset: 'system',
        },
        {
          name: 'mimeType',
          type: 'string',
          readOnly: true,
          title: 'Mime type',
          fieldset: 'system',
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
          fieldset: 'system',
        },
        {
          name: 'uploadId',
          type: 'string',
          readOnly: true,
          hidden: true,
          fieldset: 'system',
        },
        {
          name: 'path',
          type: 'string',
          title: 'Path',
          readOnly: true,
          fieldset: 'system',
        },
        {
          name: 'url',
          type: 'string',
          title: 'Url',
          readOnly: true,
          fieldset: 'system',
        },
        {
          name: 'metadata',
          type: 'sanity.imageMetadata',
          title: 'Metadata',
        },
        {
          name: 'source',
          type: 'sanity.assetSourceData',
          title: 'Source',
          readOnly: true,
          fieldset: 'system',
        },
      ],
      preview: {
        select: {
          id: '_id',
          title: 'originalFilename',
          mimeType: 'mimeType',
          size: 'size',
        },
        prepare(doc: any) {
          return {
            title: doc.title || doc.path.split('/').slice(-1)[0],
            media: {asset: {_ref: doc.id}},
            subtitle: `${doc.mimeType} (${(doc.size / 1024 / 1024).toFixed(2)} MB)`,
          }
        },
      },
      orderings: [
        {
          title: 'File size',
          name: 'fileSizeDesc',
          by: [{field: 'size', direction: 'desc'}],
        },
      ],
    },
    {
      name: 'sanity.fileAsset',
      title: 'File',
      type: 'document',
      fieldsets: [
        {
          name: 'system',
          title: 'System fields',
          description: 'These fields are managed by the system and not editable',
        },
      ],
      fields: [
        {
          name: 'originalFilename',
          type: 'string',
          title: 'Original file name',
          readOnly: true,
        },
        {
          name: 'label',
          type: 'string',
          title: 'Label',
        },
        {
          name: 'title',
          type: 'string',
          title: 'Title',
        },
        {
          name: 'description',
          type: 'string',
          title: 'Description',
        },
        {
          name: 'altText',
          type: 'string',
          title: 'Alternative text',
        },
        {
          name: 'sha1hash',
          type: 'string',
          title: 'SHA1 hash',
          readOnly: true,
          fieldset: 'system',
        },
        {
          name: 'extension',
          type: 'string',
          title: 'File extension',
          readOnly: true,
          fieldset: 'system',
        },
        {
          name: 'mimeType',
          type: 'string',
          title: 'Mime type',
          readOnly: true,
          fieldset: 'system',
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
          fieldset: 'system',
        },
        {
          name: 'path',
          type: 'string',
          title: 'Path',
          readOnly: true,
          fieldset: 'system',
        },
        {
          name: 'url',
          type: 'string',
          title: 'Url',
          readOnly: true,
          fieldset: 'system',
        },
        {
          name: 'source',
          type: 'sanity.assetSourceData',
          title: 'Source',
          readOnly: true,
          fieldset: 'system',
        },
      ],
      preview: {
        select: {
          title: 'originalFilename',
          path: 'path',
          mimeType: 'mimeType',
          size: 'size',
        },
        prepare(doc: any) {
          return {
            title: doc.title || doc.path.split('/').slice(-1)[0],
            subtitle: `${doc.mimeType} (${(doc.size / 1024 / 1024).toFixed(2)} MB)`,
          }
        },
      },
      orderings: [
        {
          title: 'File size',
          name: 'fileSizeDesc',
          by: [{field: 'size', direction: 'desc'}],
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
    {
      name: 'code',
      type: 'object',
      title: 'Code',
      components: {input: {}},
      icon: {},
      fields: [
        {name: 'language', title: 'Language', type: 'string'},
        {name: 'filename', title: 'Filename', type: 'string'},
        {title: 'Code', name: 'code', type: 'text'},
        {
          title: 'Highlighted lines',
          name: 'highlightedLines',
          type: 'array',
          of: [{type: 'number', title: 'Highlighted line'}],
        },
      ],
      preview: {
        select: {
          language: 'language',
          code: 'code',
          filename: 'filename',
          highlightedLines: 'highlightedLines',
        },
      },
    },
    {
      name: 'color',
      type: 'object',
      title: 'Color',
      fields: [
        {title: 'Hex', name: 'hex', type: 'string'},
        {title: 'Alpha', name: 'alpha', type: 'number'},
        {title: 'Hue Saturation Lightness', name: 'hsl', type: 'hslaColor'},
        {title: 'Hue Saturation Value', name: 'hsv', type: 'hsvaColor'},
        {title: 'Red Green Blue (rgb)', name: 'rgb', type: 'rgbaColor'},
      ],
      preview: {select: {title: 'hex', alpha: 'alpha', hex: 'hex', hsl: 'hsl'}},
    },
    {
      title: 'Red Green Blue (rgb)',
      name: 'rgbaColor',
      type: 'object',
      fields: [
        {name: 'r', type: 'number', title: 'Red'},
        {name: 'g', type: 'number', title: 'Green'},
        {name: 'b', type: 'number', title: 'Blue'},
        {name: 'a', type: 'number', title: 'Alpha'},
      ],
    },
    {
      title: 'Hue Saturation Value',
      name: 'hsvaColor',
      type: 'object',
      fields: [
        {name: 'h', type: 'number', title: 'Hue'},
        {name: 's', type: 'number', title: 'Saturation'},
        {name: 'v', type: 'number', title: 'Value'},
        {name: 'a', type: 'number', title: 'Alpha'},
      ],
    },
    {
      title: 'Hue Saturation Lightness',
      name: 'hslaColor',
      type: 'object',
      fields: [
        {name: 'h', type: 'number', title: 'Hue'},
        {name: 's', type: 'number', title: 'Saturation'},
        {name: 'l', type: 'number', title: 'Lightness'},
        {name: 'a', type: 'number', title: 'Alpha'},
      ],
    },
    {
      name: 'mux.videoAsset',
      type: 'object',
      title: 'Video asset',
      fields: [
        {type: 'string', name: 'status'},
        {type: 'string', name: 'assetId'},
        {type: 'string', name: 'playbackId'},
        {type: 'string', name: 'filename'},
        {type: 'number', name: 'thumbTime'},
      ],
    },
    {
      name: 'mux.video',
      type: 'object',
      title: 'Video asset reference',
      fields: [
        {
          title: 'Video',
          name: 'asset',
          type: 'reference',
          weak: true,
          to: [{type: 'mux.videoAsset'}],
        },
      ],
      preview: {
        select: {
          playbackId: 'asset.playbackId',
          status: 'asset.status',
          duration: 'asset.data.duration',
          thumbTime: 'asset.thumbTime',
          filename: 'asset.filename',
          playbackIds: 'asset.data.playback_ids',
        },
      },
    },
    {
      name: 'pertEstimate',
      type: 'object',
      title: 'PERT-estimate',
      fields: [
        {title: 'Optimistic estimate', name: 'optimistic', type: 'number'},
        {title: 'Nominal estimate', name: 'nominal', type: 'number'},
        {title: 'Pessimistic estimate', name: 'pessimistic', type: 'number'},
        {title: 'Pert estimate', name: 'calculated', type: 'number', readOnly: true},
      ],
    },
    {
      type: 'document',
      name: 'documentActionsTest',
      title: 'Document actions',
      fields: [{type: 'string', name: 'title', title: 'Title'}],
    },
    {
      type: 'document',
      name: 'poppers',
      title: 'Poppers',
      fields: [
        {type: 'string', name: 'title', title: 'Title'},
        {type: 'array', name: 'primitives', title: 'Primitives', of: [{type: 'string'}]},
      ],
    },
    {
      type: 'object',
      name: 'objectWithNestedArray',
      fields: [
        {type: 'string', name: 'fieldNo0'},
        {type: 'array', name: 'arrayNo1', of: [{type: 'objectWithNestedArray'}]},
        {type: 'string', name: 'fieldNo2'},
        {type: 'array', name: 'arrayNo3', of: [{type: 'objectWithNestedArray'}]},
        {type: 'string', name: 'fieldNo4'},
        {type: 'array', name: 'arrayNo5', of: [{type: 'objectWithNestedArray'}]},
        {type: 'string', name: 'fieldNo6'},
        {type: 'array', name: 'arrayNo7', of: [{type: 'objectWithNestedArray'}]},
        {type: 'string', name: 'fieldNo8'},
        {type: 'array', name: 'arrayNo9', of: [{type: 'objectWithNestedArray'}]},
        {type: 'string', name: 'fieldNo10'},
        {type: 'array', name: 'arrayNo11', of: [{type: 'objectWithNestedArray'}]},
        {type: 'string', name: 'fieldNo12'},
        {type: 'array', name: 'arrayNo13', of: [{type: 'objectWithNestedArray'}]},
        {type: 'string', name: 'fieldNo14'},
        {type: 'array', name: 'arrayNo15', of: [{type: 'objectWithNestedArray'}]},
        {type: 'string', name: 'fieldNo16'},
        {type: 'array', name: 'arrayNo17', of: [{type: 'objectWithNestedArray'}]},
        {type: 'string', name: 'fieldNo18'},
        {type: 'array', name: 'arrayNo19', of: [{type: 'objectWithNestedArray'}]},
      ],
    },
    {
      name: 'author',
      type: 'document',
      title: 'Author',
      description: 'This represents an author',
      preview: {
        select: {
          title: 'name',
          awards: 'awards',
          role: 'role',
          relatedAuthors: 'relatedAuthors',
          lastUpdated: '_updatedAt',
          media: 'image',
        },
      },
      fields: [
        {name: 'name', title: 'Name', type: 'string'},
        {name: 'bestFriend', title: 'Best friend', type: 'reference', to: [{type: 'author'}]},
        {
          name: 'role',
          title: 'Role',
          type: 'string',
          options: {
            list: [
              {value: 'developer', title: 'Developer'},
              {value: 'designer', title: 'Designer'},
              {value: 'ops', title: 'Operations'},
            ],
          },
        },
        {name: 'image', title: 'Image', type: 'image', options: {hotspot: true}},
        {name: 'awards', title: 'Awards', type: 'array', of: [{type: 'string'}]},
        {
          name: 'minimalBlock',
          title: 'Reset all options',
          type: 'array',
          of: [{type: 'block', styles: [], lists: [], marks: {decorators: [], annotations: []}}],
        },
      ],
    },
    {
      title: 'Person in another dataset',
      name: 'cdrPersonReference',
      type: 'crossDatasetReference',
      dataset: 'production',
      to: [
        {
          type: 'person',
          preview: {
            select: {
              title: 'name',
              media: 'image',
            },
          },
        },
      ],
    },
    {
      title: 'Document with CDR Field',
      name: 'documentWithCdrField',
      type: 'document',
      fields: [
        {
          name: 'cdrFieldInline',
          type: 'crossDatasetReference',
          dataset: 'production',
          to: [
            {
              type: 'person',
              preview: {
                select: {title: 'name'},
              },
            },
            {
              type: 'place',
              preview: {
                select: {title: 'name'},
              },
            },
          ],
        },
        {
          name: 'cdrFieldNamed',
          type: 'cdrPersonReference',
        },
      ],
    },
  ],
})
