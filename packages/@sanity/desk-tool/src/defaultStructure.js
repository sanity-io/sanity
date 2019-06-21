import React from 'react'
import Structure from '../structure-builder'
import MissingDocumentTypesMessage from './components/MissingDocumentTypesMessage'

export default () => {
  const pane = Structure.defaults()
  if (pane.getItems().length === 0) {
    return Structure.component({
      id: 'empty-list-pane',
      component: <MissingDocumentTypesMessage />
    })
  }

  return pane
}
