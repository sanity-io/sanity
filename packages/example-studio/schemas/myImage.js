export default {
  name: 'myImage',
  title: 'Some image type',
  type: 'image',
  options: {
    preview: {
      select: {
        imageUrl: 'asset.url',
        title: 'caption'
      }
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
