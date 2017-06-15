export default {
  name: 'myImage',
  title: 'Some image type',
  type: 'image',
  preview: {
    select: {
      title: 'caption',
      imageUrl: 'asset.url'
    }
  },
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string'
    }
  ]
}
