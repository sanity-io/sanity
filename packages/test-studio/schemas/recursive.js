export default {
  name: 'recursiveDocument',
  type: 'object',
  title: 'Recursive madness',
  fieldsets: [
    {name: 'recursive', title: 'Recursive madness', options: {collapsable: true}}
  ],
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
