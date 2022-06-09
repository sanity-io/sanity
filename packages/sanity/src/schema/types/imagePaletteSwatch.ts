export default {
  name: 'sanity.imagePaletteSwatch',
  title: 'Image palette swatch',
  type: 'object',
  fields: [
    {name: 'background', type: 'string', title: 'Background', readOnly: true},
    {name: 'foreground', type: 'string', title: 'Foreground', readOnly: true},
    {name: 'population', type: 'number', title: 'Population', readOnly: true},
    {name: 'title', type: 'string', title: 'String', readOnly: true},
  ],
}
