import {MdExtension as icon} from 'react-icons/md'
import CustomObjectInput from '../components/CustomObjectInput'

export default {
  type: 'document',
  name: 'customObject',
  title: 'Custom object',
  icon,
  fields: [
    {
      name: 'identifier',
      type: 'string',
      title: 'Identifier',
    },
    {name: 'someArray', type: 'array', of: [{type: 'customObject'}]},
    {
      name: 'metadata',
      type: 'object',
      title: 'Some metadata',
      fields: [
        {name: 'name', type: 'string'},
        {name: 'title', type: 'string'},
      ],
    },
    {
      name: 'image',
      type: 'image',
      title: 'Image',
      description: 'Some image',
    },
  ],
  inputComponent: CustomObjectInput,
}
