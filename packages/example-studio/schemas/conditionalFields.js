import ConditionalFields from '../components/ConditionalField'
import icon from 'react-icons/lib/md/pets'

export default {
  type: 'document',
  name: 'pet',
  title: 'Pet',
  icon,
  fields: [
    {
      name: 'kind',
      type: 'string',
      title: 'Pet kind',
      options: {
        list: [{value: 'dog', title: 'Dog'}, {value: 'cat', title: 'Cat'}]
      }
    },
    {
      name: 'likesToMeow',
      title: 'Likes to meow?',
      type: 'boolean'
    },
    {
      name: 'likesToBark',
      title: 'Likes to bark?',
      type: 'boolean'
    }
  ],
  inputComponent: ConditionalFields
}
