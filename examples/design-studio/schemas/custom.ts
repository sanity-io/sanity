import {CustomStringFieldInput} from '../fields/customString'

export default {
  type: 'document',
  name: 'custom',
  title: 'Custom',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
      inputComponent: CustomStringFieldInput,
    },
  ],
}
