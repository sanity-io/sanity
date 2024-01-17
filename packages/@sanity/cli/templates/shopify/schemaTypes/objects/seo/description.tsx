import {defineField} from 'sanity'

export default defineField({
  name: 'seo.description',
  title: 'Description',
  type: 'text',
  rows: 3,
  validation: (Rule) =>
    Rule.max(150).warning('Longer descriptions may be truncated by search engines'),
})
