import {
  isArrayOfObjectsSchemaType,
  isArraySchemaType,
  isDocumentSchemaType,
  isObjectSchemaType,
  Path,
  SchemaType,
} from '@sanity/types'
import {FormPatch, setIfMissing} from '../patch'
import {getItemType} from '../store/utils/getItemType'
import {createProtoValue} from './createProtoValue'

/**
 * Note: it doesn't make setIfMissingPatch for the value where the path terminates since it's
 * meant to be used to "fill in" required patches to create parent values
 * @param schemaType - the document type
 * @param path - the node path
 * @param value - the current document value
 * @internal
 */
export function getSetIfMissingPatches(schemaType: SchemaType, path: Path, value: unknown) {
  return prepareNodePatches(schemaType, path, value, [])
}
function prepareNodePatches(
  schemaType: SchemaType,
  path: Path,
  value: unknown,
  _parentPath: Path = []
): FormPatch[] {
  if (path.length === 0) {
    return []
  }
  const [head, ...tail] = path
  const nodePatches = []
  if (
    (isObjectSchemaType(schemaType) && !isDocumentSchemaType(schemaType)) ||
    isArraySchemaType(schemaType)
  ) {
    nodePatches.push(setIfMissing(createProtoValue(schemaType), _parentPath))
  }
  if (isArrayOfObjectsSchemaType(schemaType)) {
    const item = (value as {_key: string}[]).find((it) => it._key === (head as {_key: string})._key)
    if (!item) {
      throw new Error(`Expected to find an item at key ${JSON.stringify(head)}`)
    }
    const itemType = getItemType(schemaType, item)!
    nodePatches.push(...prepareNodePatches(itemType, tail, item, _parentPath.concat(head)))
  } else if (isObjectSchemaType(schemaType)) {
    const field = schemaType.fields.find((f) => f.name === head)
    if (!field) {
      throw new Error(
        `Expected to find a field named ${JSON.stringify(head)} in object type ${schemaType.name}`
      )
    }
    nodePatches.push(
      ...prepareNodePatches(
        field.type,
        tail,
        (value as any)?.[field.name],
        _parentPath.concat(head)
      )
    )
  }
  return nodePatches
}
