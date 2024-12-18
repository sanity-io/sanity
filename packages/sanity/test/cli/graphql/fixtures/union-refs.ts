import {Schema} from '@sanity/schema'
import {defineField, defineType} from 'sanity'

export const root = defineType({
  name: 'title',
  type: 'array',
  of: [
    {
      type: 'reference',
      to: [{type: 'union'}, {type: 'a'}],
    },
  ],
})

export const union = defineType({
  type: 'document',
  name: 'union',
  fields: [
    defineField({
      name: 'body',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'a'}, {type: 'b'}],
        },
        {type: 'a'},
      ],
    }),
  ],
})

export const a = defineType({
  type: 'document',
  name: 'a',
  fields: [defineField({name: 'title', type: 'string'})],
})
export const b = defineType({
  type: 'document',
  name: 'b',
  fields: [defineField({name: 'title', type: 'string'})],
})
//export const schemaTypes = [root, union, a, b]
export default Schema.compile({
  types: [
    root,
    union,
    a,
    b,
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
  ],
})
