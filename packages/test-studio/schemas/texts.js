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
      name: 'text2row',
      type: 'text',
      title: 'Simple text',
      description: 'Should have 2 rows',
      rows: 2
    },
    {
      name: 'text30row',
      type: 'text',
      title: 'Simple text',
      description: 'Should have 30 rows',
      rows: 30
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
