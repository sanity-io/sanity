import {defineType} from '@sanity/types'

import {eventsArray} from '../objects'

export const objectsDocument = defineType({
  name: 'objects',
  title: 'Objects',
  type: 'document',
  fields: [eventsArray],
})
