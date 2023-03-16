import {NewDocumentOptionsResolver} from 'sanity'

export const newDocumentOptions: NewDocumentOptionsResolver = (previousTemplates, context) => {
  const {creationContext} = context

  // Structure context
  if (creationContext.type === 'structure' && creationContext.schemaType === 'book') {
    return [
      ...previousTemplates,
      {
        templateId: 'book-by-author',
        title: 'Book by Espen',
        parameters: {authorId: '0dbc3925-c0b4-4838-a0d8-a14b7d6759db'},
      },
    ]
  }

  // Global context
  if (creationContext.type === 'global') {
    return previousTemplates
  }

  // Document context
  if (creationContext.type === 'document') {
    if (
      creationContext.schemaType === 'referenceTest' &&
      creationContext.documentId === 'circular'
    ) {
      return previousTemplates
    }
  }

  return previousTemplates
}
