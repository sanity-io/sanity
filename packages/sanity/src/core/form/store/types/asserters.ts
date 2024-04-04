import {isArrayOfObjectsSchemaType, isObjectSchemaType} from '@sanity/types'
import {type BaseFormNode, type ObjectFormNode} from 'sanity/_singleton'

import {type ArrayOfObjectsFormNode} from './nodes'

/** @internal */
export function isObjectFormNode(formNode: BaseFormNode): formNode is ObjectFormNode {
  return isObjectSchemaType(formNode.schemaType)
}
/** @internal */
export function isArrayOfObjectsFormNode(
  formNode: BaseFormNode,
): formNode is ArrayOfObjectsFormNode {
  return isArrayOfObjectsSchemaType(formNode.schemaType)
}
