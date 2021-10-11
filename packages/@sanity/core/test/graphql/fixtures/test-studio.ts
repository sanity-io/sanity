// import createSchema from '@sanity/base/schema-creator'
import Schema from '@sanity/schema'
// eslint-disable-next-line import/no-unresolved
import slug from '../../../../base/src/schema/types/slug'
import geopoint from '../../../../base/src/schema/types/geopoint'
import imageCrop from '../../../../base/src/schema/types/imageCrop'
import imageHotspot from '../../../../base/src/schema/types/imageHotspot'
import assetSourceData from '../../../../base/src/schema/types/assetSourceData'
import imageAsset from '../../../../base/src/schema/types/imageAsset'
import imagePalette from '../../../../base/src/schema/types/imagePalette'
import imagePaletteSwatch from '../../../../base/src/schema/types/imagePaletteSwatch'
import imageDimensions from '../../../../base/src/schema/types/imageDimensions'
import imageMetadata from '../../../../base/src/schema/types/imageMetadata'
import fileAsset from '../../../../base/src/schema/types/fileAsset'

export default Schema.compile({
  types: [
    assetSourceData,
    slug,
    geopoint,
    imageAsset,
    fileAsset,
    imageCrop,
    imageHotspot,
    imageMetadata,
    imageDimensions,
    imagePalette,
    imagePaletteSwatch,
    {
      name: 'code',
      type: 'object',
      title: 'Code',
      inputComponent: {},
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
  ],
})
