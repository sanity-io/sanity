import {type Schema, type SchemaType} from 'sanity'

/**
 * A document type, including one that extends another document type. The compiled schema points
 * `type` at the immediate parent, so `type.name === 'document'` only sees types declared as
 * `document` themselves.
 */
function isDocumentType(type: SchemaType | undefined): type is SchemaType {
  for (let current = type; current; current = current.type) {
    if (current.name === 'document') return true
  }
  return false
}

/** The workspace's document types, its own first and the `sanity.`/`system.` ones after */
export function getDocumentTypeNames(schema: Schema): string[] {
  return schema
    .getTypeNames()
    .filter((name) => name !== 'document' && isDocumentType(schema.get(name)))
    .toSorted((a, b) => Number(a.includes('.')) - Number(b.includes('.')) || a.localeCompare(b))
}
