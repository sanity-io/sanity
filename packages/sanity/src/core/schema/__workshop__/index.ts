import {defineScope} from '@sanity/ui-workshop'
import ReferenceSchemaStory from './ReferenceSchemaStory'

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
