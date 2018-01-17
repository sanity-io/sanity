// Example type that has no preview config. Useful for testing default preview config inference
import author from './author'

export default {
  name: 'authorWithoutPreview',
  type: 'document',
  title: 'Author with no preview config. Useful for testing default preview config inference',
  fields: [
    ...author.fields,
    {
      name: 'favoriteAuthors',
      title: 'Favorite authors',
      type: 'array',
      of: [{type: 'reference', to: {type: 'authorWithoutPreview'}}]
    }
  ]
}
