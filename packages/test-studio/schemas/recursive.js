import icon from 'react-icons/lib/ti/infinity-outline'

export default {
  name: 'recursiveDocument',
  type: 'document',
  title: 'Recursive madness',
  icon,
  fieldsets: [{name: 'recursive', title: 'Recursive madness', options: {collapsable: true}}],
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'myself',
      title: 'This field is of my enclosing type',
      type: 'recursiveDocument',
      fieldset: 'recursive'
    }
  ]
}
