import {BaseFormNode, ObjectFormNode} from './nodes'
import {isObjectSchemaType} from '@sanity/types'

export function isObjectFormNode(formNode: BaseFormNode): formNode is ObjectFormNode {
  return isObjectSchemaType(formNode.schemaType)
}
