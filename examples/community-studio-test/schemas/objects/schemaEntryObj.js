export default {
  name: 'schemaEntryObj',
  title: 'Schema file / entry',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Title of this document or object',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'code',
      title: 'Code / schema',
      description: 'Paste the whole Javascript file for the schema',
      type: 'code',
      options: {
        language: 'js',
        withFilename: true
      },
    },
  ],
}