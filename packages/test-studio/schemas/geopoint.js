import icon from 'react-icons/lib/md/pin-drop'

export default {
  name: 'geopointTest',
  type: 'document',
  title: 'Geopoint test',
  icon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'location',
      type: 'geopoint',
      title: 'A geopoint',
      description: 'This is a geopoint field',
    }
  ]
}
