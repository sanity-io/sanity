import {defineAssetAspect, defineField} from 'sanity'

export default defineAssetAspect({
  name: 'colourDetails',
  title: 'Colour Details',
  type: 'object',
  fields: [
    defineField({
      name: 'colourName',
      title: 'Colour Name',
      type: 'string',
    }),
  ],
})
