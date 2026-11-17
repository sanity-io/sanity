import {DocumentIcon} from '@sanity/icons/Document'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const DOCUMENT_FORM_ONLY_TYPE = 'documentFormOnlyArticle'

export const DOCUMENT_FORM_ONLY_ID = 'document-form-only-article'

export const documentFormOnlyArticle = defineType({
  name: DOCUMENT_FORM_ONLY_TYPE,
  type: 'document',
  title: 'Article',
  icon: DocumentIcon,
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'standfirst', type: 'text', title: 'Standfirst', rows: 3}),
    defineField({
      name: 'body',
      type: 'array',
      title: 'Body',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({name: 'byline', type: 'string', title: 'Byline'}),
  ],
})
