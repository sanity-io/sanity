export default {
  name: 'previewImageUrlTest',
  type: 'document',
  title: 'Preview: Using imageUrl in preview',
  preview: {
    select: {
      title: 'title',
      imageUrl: 'image.asset.url',
    },
  },
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
    },
    {
      name: 'array',
      type: 'array',
      title: 'Array',
      of: [{type: 'reference', to: {type: 'previewImageUrlTest'}}],
    },
  ],
}
