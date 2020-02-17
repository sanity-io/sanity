export default {
  name: 'diffTest',
  type: 'document',
  title: 'Diff Test',
  description: 'A document type for testing visualizing diffs',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string'
    },
    {
      name: 'friend',
      title: 'Friend',
      type: 'reference',
      to: [{type: 'author'}]
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true}
    }
  ]
}
