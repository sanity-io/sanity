import icon from 'react-icons/lib/md/check-box'

export default {
  name: 'booleansTest',
  type: 'document',
  title: 'Booleans test',
  icon,
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
