import {MdExtension as icon} from 'react-icons/md'
import CustomStringInput from '../src/components/CustomStringInput'
import CustomMyObjectInput from '../src/components/CustomMyObjectInput'
import CustomFontStringInput from '../src/components/CustomFontStringInput'
import AuthorReferenceInput from '../src/components/AuthorReferenceInput'

export default {
  name: 'customInputsTest',
  title: 'Custom input tests',
  type: 'document',
  icon,
  fields: [
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: {type: 'author'},
      inputComponent: AuthorReferenceInput,
    },
    {
      name: 'title',
      title: 'A custom input',
      description: 'A custom input defined by "field.inputComponent"',
      type: 'string',
      placeholder: 'This is the placeholder',
      inputComponent: CustomStringInput,
    },
    {
      name: 'myObject',
      title: 'A custom input for a custom object type',
      description: 'A custom input for a custom object type',
      type: 'myObject',
      inputComponent: CustomMyObjectInput,
    },
    {
      name: 'customFont',
      title: 'Input with custom font',
      description: 'Custom input that has a bundled, custom font',
      type: 'string',
      inputComponent: CustomFontStringInput,
    },
    {
      name: 'taskEstimate',
      title: 'Task estimate',
      type: 'pertEstimate',
    },
  ],
}
