import {defineScope} from '@sanity/ui-workshop'
import ReferenceSchemaStory from './ReferenceSchemaStory'

export default defineScope('sanity/schema', 'Schema', [
  {
    name: 'reference-schema',
    title: 'ReferenceSchema',
    component: ReferenceSchemaStory,
  },
])
