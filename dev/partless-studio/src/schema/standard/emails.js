import {EnvelopeIcon} from '@sanity/icons'

export default {
  name: 'emailsTest',
  type: 'document',
  title: 'Emails test',
  icon: EnvelopeIcon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'myUrlField',
      type: 'email',
      title: 'Plain email field',
      description: 'A plain email field',
    },
    {
      name: 'requiredEmail',
      type: 'email',
      title: 'Required email field',
      validation: (Rule) => Rule.required(),
    },
  ],
}
