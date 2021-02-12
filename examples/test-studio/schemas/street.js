export default {
  name: 'street',
  title: 'Street',
  type: 'object',

  fields: [
    {name: 'street', type: 'string', title: 'Street name'},
    {name: 'streetNo', type: 'string', title: 'Street number'},
    {name: 'lines', type: 'line', title: 'Address Lines'},
  ],

  initialValue: () => ({
    street: 'Come on now',
    streetNo: '123',
  }),
}
