import CustomObjectInput from '../components/CustomObjectInput'
import icon from 'react-icons/lib/md/extension'

export default {
  type: 'document',
  name: 'customObject',
  title: 'Custom object',
  icon,
  fields: [
    {
      name: 'identifier',
      type: 'string',
      title: 'Identifier'
    },
    {
      name: 'metadata',
      type: 'object',
      title: 'Some metadata',
      fields: [{name: 'name', type: 'string'}, {name: 'title', type: 'string'}]
    },
    {
      name: 'image',
      type: 'image',
      title: 'Image',
      description: 'Some image'
    }
  ],
  inputComponent: CustomObjectInput
}
