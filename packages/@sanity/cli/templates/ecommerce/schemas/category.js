export default {
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        auto: true
      }
    },
    {
      name: 'isMain',
      title: 'Is main category',
      type: 'boolean'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text'
    },
    {
      name: 'categories',
      title: 'Part of categories',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'category'}]
        }
      ]
    }
  ]
}
