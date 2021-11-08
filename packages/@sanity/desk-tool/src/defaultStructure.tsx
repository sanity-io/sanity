import Structure from './structure-builder'
import {MissingDocumentTypesMessage} from './components/MissingDocumentTypesMessage'

/**
 * @internal
 */
export function defaultStructure() {
  const pane = Structure.defaults()
  const paneItems = pane.getItems()

  if (paneItems?.length === 0) {
    return Structure.component({
      id: 'empty-list-pane',
      component: MissingDocumentTypesMessage,
    })
  }

  return pane
}

export const defaultDocument = Structure.defaultDocument
