import {TbNumber123} from 'react-icons/tb'
import {defineField, defineType} from 'sanity'

export const byTheNumbers = defineType({
  type: 'object',
  icon: TbNumber123,
  name: 'byTheNumbers',
  title: 'By the Numbers',
  fields: [defineField({type: 'string', name: 'foo'})],
})
