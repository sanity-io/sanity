import {FiBookOpen} from 'react-icons/fi'
import {defineField, defineType} from 'sanity'

export const productCombos = defineType({
  type: 'object',
  icon: FiBookOpen,
  name: 'productCombos',
  title: 'Product Combos',
  fields: [defineField({type: 'string', name: 'foo'})],
})
