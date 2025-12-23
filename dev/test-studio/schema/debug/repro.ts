import {defineField, defineType} from 'sanity'

export const countrySubtype = defineType({
  name: 'countrySubtype',
  title: 'Country Subtype',
  type: 'document',
  fields: [
    defineField({
      name: 'country',
      type: 'string',
    }),
  ],
})

export const customer = defineType({
  name: 'customerPuma',
  title: 'Puma Reproduction Schema',
  type: 'document',
  fields: [
    defineField({
      name: 'country',
      type: 'string',
      initialValue: 'no',
    }),
    defineField({
      name: 'subType',
      type: 'reference',
      to: [{type: 'countrySubtype'}],
      options: {
        filter: ({document}) => {
          return {
            filter: `country == $country`,
            params: {
              country: document.country,
            },
          }
        },
      },
    }),
  ],
})
