export default {
  name: 'slugsTest',
  type: 'document',
  title: 'Slugs test',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'slug',
      type: 'slug',
      title: 'Field of slug type',
      description: 'This is a slug field that should update according to current title',
      options: {
        source: document => document.title,
        maxLength: 96,
        auto: true,
      }
    }
  ]
}
