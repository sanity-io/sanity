export default {
  type: 'document',
  name: 'documentActionsTest',
  title: 'Document actions',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
    {type: 'datetime', name: 'publishedAt', title: 'Published at'},
    {
      name: 'someBoolean',
      title: 'Some Boolean',
      type: 'boolean',
    },
  ],
}
