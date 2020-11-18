import {MdCheckBox as icon} from 'react-icons/md'

export default {
  name: 'booleansTest',
  type: 'document',
  title: 'Booleans test',
  icon,
  fieldsets: [
    {
      name: 'collection',
      title: 'Collection of switches',
      description: 'Show how long descriptions behave on av switch in a fieldset',
    },
  ],
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'switchTest',
      type: 'boolean',
      title: `I'm a switch`,
      description: 'Try toggling me! This is the new switch design',
    },
    {
      name: 'switchIndeterminate2',
      type: 'boolean',
      title: `Don't toggle me`,
      readOnly: true,
    },
    {
      name: 'checkboxIndeterminate3',
      type: 'boolean',
      title: `Don't check me`,
      readOnly: true,
      description: 'Indeterminate state',
      validation: (Rule) => [Rule.valid(false).warning('hello world')],
      options: {
        layout: 'checkbox',
      },
    },
    {
      name: 'switch',
      type: 'boolean',
      description: 'Should be either true or false',
      title: 'Check me?',
    },
    {
      name: 'checkbox',
      type: 'boolean',
      description:
        'Should be displayed as a checkbox Should be displayed as a checkbox Should be displayed as a checkbox Should be displayed as a checkboxShould be displayed as a checkboxShould be displayed as a checkboxShould be displayed as a checkboxShould be displayed as a checkboxShould be displayed as a checkboxShould be displayed as a checkbox',
      options: {
        layout: 'checkbox',
      },
      title: 'Checked?',
    },
    {
      name: 'switchLong',
      type: 'boolean',
      title: 'A switch with a long description',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean convallis suscipit diam, eget blandit orci euismod in. Curabitur ac tellus pellentesque, porttitor tellus id, venenatis massa. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eu augue mattis, accumsan risus ut, iaculis risus. Integer cursus justo nibh, ac ultricies orci lobortis et. Curabitur ac commodo justo, sit amet facilisis mi. Nunc arcu nibh, commodo maximus risus non, suscipit laoreet nisl. Nam dignissim, sem vel tempor tristique, metus odio vehicula sapien, nec rhoncus urna diam eget nisl. In ut arcu ante. Pellentesque maximus, mi non faucibus hendrerit, massa massa pellentesque arcu, ac egestas odio nunc ac erat.',
      fieldset: 'collection',
    },
    {
      name: 'switchShort',
      type: 'boolean',
      title: 'Short description, but longer title! Hello. Cats are the best.',
      description: 'Lorem ipsum',
      fieldset: 'collection',
    },
  ],
}
