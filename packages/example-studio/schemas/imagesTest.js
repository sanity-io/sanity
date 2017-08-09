
export default {
  name: 'imagesTest',
  type: 'object',
  title: 'Images test',
  preview: {
    select: {
      title: 'title',
      imageUrl: 'mainImage.asset.url',
    },
  },
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'imageGalleryInGrid',
      title: 'Image Gallery',
      description: 'An array of images. options: {layout: "grid"}',
      type: 'array',
      options: {
        layout: 'grid'
      },
      of: [
        {
          name: 'myImage',
          title: 'My Image',
          type: 'myImage'
        }
      ]
    },
    {
      name: 'imageGallery',
      title: 'Image gallery (sortable, not grid)',
      type: 'array',
      options: {
        sortable: true,
        layout: 'grid'
      },
      of: [
        {
          title: 'Image',
          type: 'image',
          preview: {
            select: {
              imageUrl: 'asset.url',
              title: 'caption'
            }
          },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
              options: {
                isHighlighted: true
              }
            }
          ]
        }
      ]
    },
    {
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'caption',
          type: 'string',
          title: 'Caption'
        }
      ]
    },
    {
      name: 'myImage',
      title: 'My Image',
      type: 'myImage',
      required: true,
      readOnly: true
    },
    {
      name: 'pngImage',
      title: 'PNG image',
      type: 'image',
      options: {
        hotspot: true,
        accept: 'image/png'
      }
    }
  ]
}
