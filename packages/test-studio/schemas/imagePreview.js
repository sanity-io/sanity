export default {
  name: 'imagesPreviewTest',
  type: 'document',
  title: 'Images Preview test',
  preview: {
    select: {
      title: 'title',
      media: 'mainImage'
    },
  },
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'mainImage',
      title: 'Image',
      type: 'image',
      description: `
        Image hotspot should be possible to change.
        Caption should be visible in image field, full description should be editable in modal.
      `,
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
          options: {
            isHighlighted: true
          }
        },
        {
          name: 'description',
          type: 'string',
          title: 'Full description'
        }
      ]
    }
  ]
}
