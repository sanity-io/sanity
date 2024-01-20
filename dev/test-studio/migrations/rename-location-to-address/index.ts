import {at, defineMigration, patch, set, unset} from '@sanity/migrate'

const addresses = [
  {city: 'Oslo', country: 'Norway'},
  {city: 'Stockholm', country: 'Sweden'},
  {city: 'Copenhagen', country: 'Denmark'},
  {city: 'Helsinki', country: 'Finland'},
  {city: 'Reykjavik', country: 'Iceland'},
  {city: 'Torshavn', country: 'Faroe Islands'},
]

export default defineMigration({
  title: 'Rename Location to Address',
  documentTypes: ['author'],
  migrate: {
    document(doc) {
      return patch(doc._id, [
        at('address', set(addresses[Math.floor(Math.random() * addresses.length)])),
        at('location', unset()),
      ])
    },
  },
})
