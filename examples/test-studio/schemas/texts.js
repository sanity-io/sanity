import {MdFormatAlignLeft as icon} from 'react-icons/md'

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
      description: 'This is a simple text field',
    },
    {
      name: 'rows2',
      type: 'text',
      title: '2 rows text',
      description: 'This is a simple text field',
      rows: 2,
    },
    {
      name: 'rows15',
      type: 'text',
      title: '15 rows text',
      description: 'This is a simple text field',
      rows: 15,
    },
    {
      name: 'readonlyField',
      type: 'text',
      title: 'A read only text',
      description: 'It may have a value, but it cannot be edited',
      readOnly: true,
    },
  ],
}
