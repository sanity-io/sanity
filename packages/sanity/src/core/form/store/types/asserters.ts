import {
  isArrayOfObjectsSchemaType,
  isArrayOfPrimitivesSchemaType,
  isObjectSchemaType,
} from '@sanity/types'

import {
  type ArrayOfPrimitivesFormNode,
  type ArrayOfObjectsFormNode,
  type BaseFormNode,
  type ObjectFormNode,
} from './nodes'

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

/** @internal */
export function isArrayOfPrimitivesFormNode(
  formNode: BaseFormNode,
): formNode is ArrayOfPrimitivesFormNode {
  return isArrayOfPrimitivesSchemaType(formNode.schemaType)
}
