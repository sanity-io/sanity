import CustomObjectInput from '../components/CustomObjectInput'

export default {
  type: 'document',
  name: 'customObject',
  title: 'Custom object',
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
      fields: [
        {name: 'name', type: 'string'},
        {name: 'title', type: 'string'}
      ]
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
