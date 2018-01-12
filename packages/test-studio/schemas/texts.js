import icon from 'react-icons/lib/md/format-align-left'

export default {
  name: 'textsTest',
  type: 'document',
  title: 'Texts tests',
  icon,
  fields: [
    {
      name: 'title',
      type: 'text',
      title: 'Simple text',
      description: 'This is a simple text field'
    },
    {
      name: 'readonlyField',
      type: 'text',
      title: 'A read only text',
      description: 'It may have a value, but it cannot be edited',
      readOnly: true
    }
  ]
}
