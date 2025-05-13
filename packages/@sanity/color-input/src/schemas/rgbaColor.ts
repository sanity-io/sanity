import {defineType} from 'sanity'

export const rgbaColor = defineType({
  title: 'Red Green Blue (rgb)',
  name: 'rgbaColor',
  type: 'object',
  fields: [
    {name: 'r', type: 'number', title: 'Red'},
    {name: 'g', type: 'number', title: 'Green'},
    {name: 'b', type: 'number', title: 'Blue'},
    {name: 'a', type: 'number', title: 'Alpha'},
  ],
})
