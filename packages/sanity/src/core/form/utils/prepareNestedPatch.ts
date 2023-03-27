import {
  isArrayOfObjectsSchemaType,
  isArraySchemaType,
  isDocumentSchemaType,
  isObjectSchemaType,
  Path,
  PathSegment,
  SchemaType,
} from '@sanity/types'
import {FormPatch, setIfMissing} from '../patch'
import {getItemType} from '../store/utils/getItemType'
import {createProtoValue} from './createProtoValue'

function selectItem(array: {_key: string}[], itemSelector: PathSegment) {
  if (typeof itemSelector === 'number') {
    return array[itemSelector]
  }
  return array.find((it) => it._key === (itemSelector as {_key: string})._key)
}

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
    if (!value) {
      return nodePatches
    }
    const item = selectItem(value as {_key: string}[], head)
    if (!item) {
      return nodePatches
    }
    const itemType = getItemType(schemaType, item)!
    nodePatches.push(...prepareNodePatches(itemType, tail, item, _parentPath.concat(head)))
  } else if (isObjectSchemaType(schemaType)) {
    const field = schemaType.fields.find((f) => f.name === head)
    if (!field) {
      return nodePatches
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
