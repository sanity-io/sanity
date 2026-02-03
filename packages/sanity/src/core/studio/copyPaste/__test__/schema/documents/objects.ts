import {eventsArray} from '../objects'
import {defineType} from '@sanity/types'

export const objectsDocument = defineType({
  name: 'objects',
  title: 'Objects',
  type: 'document',
  fields: [eventsArray],
})
