export default {
  name: 'sanity.imageDimensions',
  type: 'object',
  title: 'Image dimensions',
  fields: [
    {name: 'height', type: 'number', title: 'Height', readOnly: true},
    {name: 'width', type: 'number', title: 'Width', readOnly: true},
    {name: 'aspectRatio', type: 'number', title: 'Aspect ratio', readOnly: true},
  ],
}
