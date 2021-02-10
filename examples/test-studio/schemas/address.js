export default {
  name: 'address',
  title: 'Address',
  type: 'object',

  fields: [
    {name: 'street', type: 'string', title: 'Street name'},
    {name: 'streetNo', type: 'string', title: 'Street number'},
    {name: 'city', type: 'string', title: 'City'},
  ],

  initialValue: () => ({
    street: 'Come on now',
    streetNo: '123',
  }),
}
