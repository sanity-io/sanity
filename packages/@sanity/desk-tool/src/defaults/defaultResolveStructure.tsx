import {StructureBuilder} from '@sanity/base/structure'
import {MissingDocumentTypesMessage} from '../components/MissingDocumentTypesMessage'
import {UnresolvedPaneNode} from '../types'

/**
 * @internal
 */
export function defaultResolveStructure(structureBuilder: StructureBuilder): UnresolvedPaneNode {
  const defaultList = structureBuilder.defaults()
  const defaultListItems = defaultList.getItems()

  if (defaultListItems?.length === 0) {
    return structureBuilder.component({
      id: 'empty-list-pane',
      component: MissingDocumentTypesMessage,
    }) as any
  }

  return defaultList as any
}
