import {AuthorReferenceInput} from './components/AuthorReferenceInput'
import CustomFontStringInput from './components/CustomFontStringInput'
import CustomMyObjectInput from './components/CustomMyObjectInput'
import CustomStringInput from './components/CustomStringInput'

export default {
  name: 'customInputsTest',
  title: 'Custom input tests',
  type: 'document',
  fields: [
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: {type: 'author'},
      components: {input: AuthorReferenceInput},
    },
    {
      name: 'title',
      title: 'A custom input',
      description: 'A custom input defined by "field.inputComponent"',
      type: 'string',
      placeholder: 'This is the placeholder',
      components: {input: CustomStringInput},
    },
    {
      type: 'string',
      name: 'inputComponentErrorTest',
      title: 'Input component error test',
      // this should make a validation warning to appear in the console
      components: {input: 'NOT A REACT COMPONENT'},
    },
    {
      name: 'myObject',
      title: 'A custom input for a custom object type',
      description: 'A custom input for a custom object type',
      type: 'myObject',
      components: {input: CustomMyObjectInput},
    },
    {
      name: 'customFont',
      title: 'Input with custom font',
      description: 'Custom input that has a bundled, custom font',
      type: 'string',
      components: {input: CustomFontStringInput},
    },
    {
      name: 'Undefined',
      title: 'Undefined input componnet',
      description: 'This should be a schema warning',
      type: 'string',
      // this should make a validation warning to appear in the console
      components: {input: undefined},
    },
    // {
    //   name: 'taskEstimate',
    //   title: 'Task estimate',
    //   type: 'pertEstimate',
    // },
  ],
}
