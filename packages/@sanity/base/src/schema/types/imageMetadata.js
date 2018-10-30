export default {
  name: 'sanity.imageMetadata',
  title: 'Image metadata',
  type: 'object',
  fieldsets: [
    {
      name: 'extra',
      title: 'Extra metadata…',
      options: {
        collapsable: true
      }
    }
  ],
  fields: [
    {
      name: 'location',
      type: 'geopoint'
    },
    {
      name: 'dimensions',
      title: 'Dimensions',
      type: 'sanity.imageDimensions',
      fieldset: 'extra'
    },
    {
      name: 'palette',
      type: 'sanity.imagePalette',
      title: 'Palette',
      fieldset: 'extra'
    },
    {
      name: 'lqip',
      title: 'LQIP (Low-Quality Image Placeholder)',
      type: 'string',
      readOnly: true
    }
  ]
}
