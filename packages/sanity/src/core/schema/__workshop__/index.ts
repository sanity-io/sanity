import {defineScope} from '@sanity/ui-workshop'
import ReferenceSchemaStory from './ReferenceSchemaStory'

export default defineScope({
  name: 'sanity/schema',
  title: 'Schema',
  stories: [
    {
      name: 'reference-schema',
      title: 'ReferenceSchema',
      component: ReferenceSchemaStory,
    },
  ],
})
