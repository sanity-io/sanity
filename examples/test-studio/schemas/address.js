export default {
  name: 'address',
  title: 'Address',
  type: 'object',

  fields: [
    {
      name: 'homeStreet',
      title: 'Home Street',
      type: 'street',
    },
    {
      name: 'officeStreet',
      title: 'Office Street',
      type: 'street',
    },
    {
      title: 'My Streets',
      name: 'streets',
      type: 'array',
      of: [{type: 'street'}],
    },
    {name: 'city', type: 'string', title: 'City'},
  ],

  initialValue: () => ({
    city: 'Abule',
    streets: [
      {
        _type: 'street',
        street: 'One street lane',
        streetNo: '4567',
      },
    ],
  }),
}
