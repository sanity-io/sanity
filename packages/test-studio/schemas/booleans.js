import icon from 'react-icons/lib/md/check-box'

export default {
  name: 'booleansTest',
  type: 'document',
  title: 'Booleans test',
  icon,
  fieldsets: [
    {
      name: 'collection',
      title: 'Collection of switches',
      description: 'Show how long descriptions behave on av switch in a fieldset'
    }
  ],
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
    },
    {
      name: 'switchLong',
      type: 'boolean',
      title: 'A switch with a long description',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean convallis suscipit diam, eget blandit orci euismod in. Curabitur ac tellus pellentesque, porttitor tellus id, venenatis massa. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eu augue mattis, accumsan risus ut, iaculis risus. Integer cursus justo nibh, ac ultricies orci lobortis et. Curabitur ac commodo justo, sit amet facilisis mi. Nunc arcu nibh, commodo maximus risus non, suscipit laoreet nisl. Nam dignissim, sem vel tempor tristique, metus odio vehicula sapien, nec rhoncus urna diam eget nisl. In ut arcu ante. Pellentesque maximus, mi non faucibus hendrerit, massa massa pellentesque arcu, ac egestas odio nunc ac erat.',
      fieldset: 'collection'
    }
  ]
}
