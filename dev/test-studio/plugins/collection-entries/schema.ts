import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {FolderIcon} from '@sanity/icons/Folder'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {CollectionEntriesInput} from './CollectionEntriesInput'
import {ENTRY_TYPE, COLLECTION_TYPE} from './constants'

export const collectionEntry = defineType({
  name: ENTRY_TYPE,
  type: 'document',
  title: 'Collection entry',
  icon: DocumentTextIcon,
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({
      name: 'body',
      type: 'array',
      title: 'Body',
      of: [
        // Matches the inline entry editor's schema, so both editors accept the same content.
        defineArrayMember({
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [],
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})

export const entryCollection = defineType({
  name: COLLECTION_TYPE,
  type: 'document',
  title: 'Collection',
  icon: FolderIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
    }),
    defineField({
      name: 'entries',
      type: 'array',
      title: 'Entries',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: ENTRY_TYPE}],
          weak: true,
        }),
      ],
      components: {input: CollectionEntriesInput},
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
