import {type Schema, type SchemaType} from 'sanity'

function isDocumentType(type: SchemaType | undefined): boolean {
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
