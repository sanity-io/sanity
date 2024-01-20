import {type NewDocumentOptionsResolver} from 'sanity'

export const newDocumentOptions: NewDocumentOptionsResolver = (prev, {creationContext}) => {
  if (creationContext.type === 'structure' && creationContext.schemaType === 'book') {
    return [
      ...prev,
      {
        templateId: 'book-by-author',
        title: 'Book by Espen',
        parameters: {authorId: '0dbc3925-c0b4-4838-a0d8-a14b7d6759db'},
      },
    ]
  }

  return prev
}
