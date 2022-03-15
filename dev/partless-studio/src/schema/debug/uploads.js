import {PublishIcon} from '@sanity/icons'
// import DefaultAssetSource from 'part:@sanity/form-builder/input/image/asset-source-default'
// import DefaultFileAssetSource from 'part:@sanity/form-builder/input/file/asset-source-default'
// import petsAssetSource from '../../parts/assetSources/pets'
// import noopAssetSource from '../../parts/assetSources/noop'

export default {
  name: 'uploadsTest',
  type: 'document',
  title: 'Uploads test',
  icon: PublishIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'onlyOneFile',
      title: 'File',
      description: 'A lonely file',
      type: 'file',
    },
    {
      name: 'imagesOnly',
      title: 'Only images',
      description: 'An array that accepts image',
      type: 'array',
      of: [{type: 'image', title: 'Image'}],
    },
    {
      name: 'blocks',
      title: 'Blocks',
      description: 'Upload to array of images in block text',
      type: 'array',
      of: [
        {type: 'block'},
        {
          name: 'gallery',
          type: 'object',
          title: 'Gallery',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
            },
            {
              name: 'images',
              type: 'array',
              of: [{type: 'image', title: 'Image'}],
            },
          ],
          preview: {
            select: {
              title: 'title',
              imageUrl: 'images.0.asset.url',
            },
          },
        },
      ],
    },
    {
      name: 'imagesAndFiles',
      title: 'Images and files',
      description: 'An array that accepts images and files',
      type: 'array',
      of: [
        {type: 'file', title: 'File'},
        {type: 'image', title: 'Image'},
      ],
    },
    {
      name: 'onlyOneFileWithCustomAssetSource',
      title: 'File with custom asset source',
      description: 'A lonely file',
      type: 'file',
      options: {
        sources: [
          // DefaultFileAssetSource,
          // petsAssetSource, noopAssetSource
        ],
      },
    },
    {
      name: 'onlyOneImageWithCustomAssetSource',
      title: 'Image with custom asset source',
      description: 'A lonely image',
      type: 'image',
      options: {
        sources: [
          // DefaultAssetSource,
          //  petsAssetSource, noopAssetSource
        ],
      },
    },
    {
      name: 'onlyOneImage',
      title: 'Image',
      description: 'A lonely image',
      type: 'image',
    },
    {
      name: 'imagesAndFilesInGrid',
      title: 'Images and files (in a grid list)',
      description: 'An array that accepts images and files',
      type: 'array',
      options: {
        layout: 'grid',
      },
      of: [
        {type: 'file', title: 'File'},
        {type: 'image', title: 'Image'},
      ],
    },
    {
      name: 'onlyPNGAndPdf',
      title: 'Only PNG or PDF files',
      description: 'An array that accepts PNG or PDF files only',
      type: 'array',
      options: {
        layout: 'grid',
      },
      of: [
        {type: 'file', title: 'File', options: {accept: '.pdf'}},
        {type: 'image', title: 'Image', options: {accept: '.png'}},
      ],
    },
  ],
}
