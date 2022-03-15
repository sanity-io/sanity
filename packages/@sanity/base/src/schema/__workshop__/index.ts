import {defineScope} from '@sanity/ui-workshop'
import ReferenceSchemaStory from './ReferenceSchemaStory'

export default defineScope('base/schema', 'Schema', [
  {
    name: 'reference-schema',
    title: 'ReferenceSchema',
    component: ReferenceSchemaStory,
  },
])
