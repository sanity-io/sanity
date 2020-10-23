export default {
  name: 'customNumber',
  type: 'number',
  title: 'Custom number',
  validation: (Rule) => Rule.min(0).max(1000),
}
