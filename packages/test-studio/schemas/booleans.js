export default {
  name: 'booleansTest',
  type: 'object',
  title: 'Booleans test',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'switch',
      type: 'boolean',
      description: 'Should be either true or false',
      title: 'Check me?'
    },
    {
      name: 'checkbox',
      type: 'boolean',
      description: 'Should be displayed as a checkbox',
      options: {
        layout: 'checkbox'
      },
      title: 'Checked?'
    }
  ]
}
