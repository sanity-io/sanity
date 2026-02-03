import ReferenceSchemaStory from './ReferenceSchemaStory'
import {defineScope} from '@sanity/ui-workshop'

export default defineScope({
  name: 'core/schema',
  title: 'schema',
  stories: [
    {
      name: 'reference-schema',
      title: 'ReferenceSchema',
      component: ReferenceSchemaStory,
    },
  ],
})
