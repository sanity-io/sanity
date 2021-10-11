import {TiInfinityOutline as icon} from 'react-icons/ti'

export default {
  name: 'recursiveDocument',
  description: 'This is the description to the madness',
  type: 'document',
  title: 'Recursive madness',
  icon,
  fieldsets: [
    {
      name: 'recursive',
      title: 'Recursive madness',
      description: 'This is the discription to the fieldset',
      options: {collapsable: true},
    },
  ],
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'myself',
      title: 'This field is of my enclosing type',
      type: 'recursiveDocument',
      fieldset: 'recursive',
    },
  ],
}
