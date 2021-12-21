import {StructureBuilder} from '@sanity/structure'
import {MissingDocumentTypesMessage} from './components/MissingDocumentTypesMessage'

/**
 * @internal
 */
export function defaultStructure(S: StructureBuilder) {
  const pane = S.defaults()
  const paneItems = pane.getItems()

  if (paneItems?.length === 0) {
    return S.component({
      id: 'empty-list-pane',
      component: MissingDocumentTypesMessage,
    })
  }

  return pane
}

/**
 * @internal
 */
// export const defaultDocument = S.defaultDocument
