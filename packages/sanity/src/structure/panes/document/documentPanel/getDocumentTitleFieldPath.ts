import {
  isObjectSchemaType,
  isReferenceSchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type Path,
  type SchemaType,
} from '@sanity/types'
import {fromString} from '@sanity/util/paths'

/**
 * Field path behind the document pane title, when `preview.select.title` addresses one
 * field on this document.
 *
 * Titles built in `prepare()` from several selected values have no `select.title` path,
 * and a `select.title` that leaves this document (a reference, an array item, a missing
 * field) is not a field the form can focus. Both return `undefined`.
 */
export function getDocumentTitleFieldPath(
  schemaType: ObjectSchemaType | undefined,
): Path | undefined {
  const selectTitle = schemaType?.preview?.select?.title
  if (typeof selectTitle !== 'string' || selectTitle.length === 0 || !schemaType) {
    return undefined
  }

  let path: Path
  try {
    path = fromString(selectTitle)
  } catch {
    return undefined
  }

  if (!isDirectDocumentFieldPath(schemaType, path)) {
    return undefined
  }

  return path
}

/**
 * True when every segment is a field name on this document. Array indices and
 * `_key` segments are not a stable field, and a reference's target fields live
 * on another document.
 */
function isDirectDocumentFieldPath(schemaType: ObjectSchemaType, path: Path): boolean {
  if (path.length === 0) return false

  let current: SchemaType = schemaType
  for (let index = 0; index < path.length; index++) {
    const segment = path[index]
    if (typeof segment !== 'string') return false
    if (isReferenceSchemaType(current) || !isObjectSchemaType(current)) return false

    const field: ObjectField | undefined = current.fields.find((entry) => entry.name === segment)
    // `hidden` is compiled onto the field type, not the field entry. A callback
    // can still reveal the field, so only a static `true` is skipped.
    if (!field || field.type.hidden === true) return false
    if (index === path.length - 1) return true

    current = field.type
  }

  return false
}
