import CustomStringInput from '../src/components/CustomStringInput'
import CustomMyObjectInput from '../src/components/CustomMyObjectInput'
import CustomFontStringInput from '../src/components/CustomFontStringInput'
import PertEstimateInput from '../src/components/PertEstimateInput'

export default {
  name: 'customInputsTest',
  title: 'Custom input tests',
  type: 'document',
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
    },
    {
      name: 'customFont',
      title: 'Input with custom font',
      description: 'Custom input that has a bundled, custom font',
      type: 'string',
      inputComponent: CustomFontStringInput
    },
    {
      name: 'taskEstimate',
      title: 'Task estimate',
      type: 'pertEstimate',
      inputComponent: PertEstimateInput
    }
  ]
}
