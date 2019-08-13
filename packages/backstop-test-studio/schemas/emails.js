import icon from 'react-icons/lib/md/email'

export default {
  name: 'emailsTest',
  type: 'document',
  title: 'Emails test',
  icon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'myUrlField',
      type: 'email',
      title: 'Plain email field',
      description: 'A plain email field'
    }
  ]
}
