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
    {name: 'city', type: 'string', title: 'City'},
  ],

  initialValue: () => ({
    city: 'Abule',
    officeStreet: {
      _type: 'street',
      streetNo: '100',
    },
  }),
}
