export const myImage = {
  name: 'myImage',
  title: 'Some image type',
  type: 'image',
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string'
    }
  ]
}

export default {
  name: 'imagesTest',
  type: 'document',
  title: 'Images test',
  description: 'Different test cases of image fields',
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
      description: 'Image hotspot should be possible to change. Caption should be visible in image field, full description should be editable in modal',
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
    },
    {
      name: 'myImage',
      title: 'Field of custom image type',
      type: 'myImage',
      description: 'Should be like myImage',
      required: true
    },
    {
      name: 'pngImage',
      title: 'PNG image',
      type: 'image',
      description: 'Should not accept other image types than png',
      options: {
        hotspot: true,
        accept: 'image/png'
      }
    }
  ]
}
