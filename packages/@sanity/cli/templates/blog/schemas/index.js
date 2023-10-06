import blockContent from './blockContent'
import category from './category'
import post from './post'
import author from './author'

export const schemaTypes = [
  post,
  author,
  category,
  blockContent,
  {
    title: 'Person in another dataset',
    name: 'cdrPersonReference',
    type: 'crossDatasetReference',
    dataset: 'production',
    to: [{type: 'person', preview: {select: {title: 'name', media: 'image'}}}],
  },
  {
    title: 'Document with CDR Field',
    name: 'documentWithCdrField',
    type: 'document',
    fields: [
      {
        name: 'cdrFieldInline',
        type: 'crossDatasetReference',
        dataset: 'production',
        to: [
          {type: 'person', preview: {select: {title: 'name'}}},
          {type: 'place', preview: {select: {title: 'name'}}},
        ],
      },
      {
        name: 'cdrFieldNamed',
        type: 'cdrPersonReference',
      },
    ],
  },
]
