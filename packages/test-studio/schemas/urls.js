import icon from 'react-icons/lib/md/link'

export default {
  name: 'urlsTest',
  type: 'document',
  title: 'URLs test',
  icon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'myUrlField',
      type: 'url',
      title: 'Plain url',
      description: 'A plain URL field'
    }
  ]
}
