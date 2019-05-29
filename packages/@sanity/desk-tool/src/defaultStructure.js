import React from 'react'
import Structure from '../structure-builder'
import MissingDocumentTypesMessage from './components/MissingDocumentTypesMessage'

export default () => {
  const items = Structure.documentTypeListItems()
  if (items.length === 0) {
    return Structure.component({
      id: 'empty-list-pane',
      component: <MissingDocumentTypesMessage />
    })
  }
  return Structure.list()
    .id('__root__')
    .title('Content')
    .showIcons(items.some(item => item.getSchemaType().icon))
    .items(items)
}
