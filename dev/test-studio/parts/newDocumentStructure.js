import {
  initialValueTemplateItem,
  defaultInitialValueTemplateItems,
} from '@sanity/base/structure-builder'

export default [
  initialValueTemplateItem('book-by-author', {authorId: 'grrm'})
    .id('grrm-book')
    .title('GRRM book')
    .description('Book by George R. R. Martin'),

  ...defaultInitialValueTemplateItems(),
]
