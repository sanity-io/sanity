export default {
  name: 'studioImage',
  type: 'image',
  title: 'Studio image',
  options: {
    hotspot: true,
    storeOriginalFilename: false,
  },
  fields: [
    {
      name: 'version',
      type: 'string',
      title: 'Studio version',
      options: {
        isHighlighted: true
      }
    },
    {
      name: 'caption',
      type: 'string',
      title: 'Caption',
      options: {
        isHighlighted: true
      }
    },
    {
      name: 'alt',
      type: 'string',
      title: 'Alternative text',
      description: 'Important for SEO and accessiblity.',
      options: {
        isHighlighted: true
      }
    }
  ],
  preview: {
    select: {
      imageUrl: 'asset.url',
      title: 'caption'
    }
  }
}
