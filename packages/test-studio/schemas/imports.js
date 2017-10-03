
export default {
  name: 'importsTest',
  type: 'object',
  title: 'Imports test',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'imagesOnly',
      title: 'Only images',
      description: 'An array that accepts image',
      type: 'array',
      of: [{type: 'image', title: 'Image'}]
    },
    {
      name: 'imagesAndFiles',
      title: 'Images and files',
      description: 'An array that accepts images and files',
      type: 'array',
      of: [
        {type: 'file', title: 'File'},
        {type: 'image', title: 'Image'}
      ]
    },
    {
      name: 'imagesAndFilesInGrid',
      title: 'Images and files (in a grid list)',
      description: 'An array that accepts images and files',
      type: 'array',
      options: {
        layout: 'grid'
      },
      of: [
        {type: 'file', title: 'File'},
        {type: 'image', title: 'Image'}
      ]
    },
    {
      name: 'onlyPNGAndPdf',
      title: 'Only PNG or PDF files',
      description: 'An array that accepts PNG or PDF files only',
      type: 'array',
      options: {
        layout: 'grid'
      },
      of: [
        {type: 'file', title: 'File', options: {accept: '.pdf'}},
        {type: 'image', title: 'Image', options: {accept: '.png'}}
      ]
    }
  ]
}
