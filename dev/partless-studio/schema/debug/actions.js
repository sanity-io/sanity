export default {
  name: 'actionsTest',
  type: 'document',
  title: 'Experimental actions test',
  // toggle these to test various combinations of ['create', 'update', 'delete', 'publish']
  // eslint-disable-next-line camelcase
  __experimental_actions: [],
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
  ],
}
