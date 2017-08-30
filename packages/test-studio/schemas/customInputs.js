import CustomStringInput from '../src/components/CustomStringInput'
import CustomMyObjectInput from '../src/components/CustomMyObjectInput'

export default {
  name: 'customInputsTest',
  title: 'Custom input tests',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'A custom input',
      description: 'A custom input defined by "field.inputComponent"',
      type: 'string',
      placeholder: 'This is the placeholder',
      inputComponent: CustomStringInput
    },
    {
      name: 'myObject',
      title: 'A custom input for a custom object type',
      description: 'A custom input for a custom object type',
      type: 'myObject',
      inputComponent: CustomMyObjectInput
    }
  ]
}
