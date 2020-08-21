export default {
  type: 'document',
  name: 'author',
  title: 'Author',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: 'Name',
      validation: Rule =>
        Rule.required()
          .min(10)
          .max(80)
    }
  ]
}
