export default {
  name: 'street',
  title: 'Street',
  type: 'object',

  fields: [
    {
      name: 'street',
      type: 'string',
      title: 'Street name',
      initialValue: '12 way street, off 11th avenue',
    },
    {name: 'streetNo', type: 'string', title: 'Street number'},
    {name: 'lines', type: 'line', title: 'Address Lines'},
    {
      title: 'Tags',
      name: 'tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    },
  ],

  /* initialValue: () => ({
    // street: '10 way street, off 11th avenue',
    streetNo: '123',
    tags: ['life', 'value'],
  }), */
}
