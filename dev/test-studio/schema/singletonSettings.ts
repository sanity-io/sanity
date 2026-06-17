import {CogIcon} from '@sanity/icons'
import {defineField, defineType} from '@sanity/types'

/**
 * Example singleton schema type. Demonstrates the new
 * `singleton: { documentId: ... }` configuration introduced as a first-class
 * Studio primitive. Studio will:
 *
 * - Hide this type from the implicit content list.
 * - Strip the `duplicate` action from the document pane.
 * - Exclude this type from `newDocumentOptions`-driven UI.
 *
 * To surface the singleton, see `dev/test-studio/structure/resolveStructure.ts`.
 */
export default defineType({
  name: 'singletonSettings',
  title: 'Singleton settings (example)',
  type: 'document',
  icon: CogIcon,
  singleton: {documentId: 'singletonSettings'},
  fields: [
    defineField({
      name: 'siteTitle',
      title: 'Site title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
  ],
})
