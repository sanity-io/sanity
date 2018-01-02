export default {
  name: 'previewMediaTest',
  type: 'document',
  title: 'Preview: Using media in preview',
  preview: {
    select: {
      title: 'title',
      media: 'image'
    },
  },
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image'
    },
    {
      name: 'array',
      type: 'array',
      title: 'Array',
      of: [{type: 'reference', to: {type: 'previewMediaTest'}}]
    }
  ]
}
