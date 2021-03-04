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
      initialValue: {
        _type: 'street',
        street: 'One street lane',
        streetNo: '4567',
      },
    },
    {name: 'city', type: 'string', title: 'City'},
  ],

  initialValue: () => ({
    city: 'Abule',
    /* homeStreet: {
      _type: 'street',
      street: 'Two street lane',
      streetNo: '4567',
    }, */
  }),
}
