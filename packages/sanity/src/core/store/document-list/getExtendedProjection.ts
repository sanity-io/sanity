import {type SchemaType, type SortOrderingItem} from '@sanity/types'

const IMPLICIT_SCHEMA_TYPE_FIELDS = ['_id', '_type', '_createdAt', '_updatedAt', '_rev']

// Takes a path array and a schema type and builds a GROQ join every time it enters a reference field
function joinReferences(schemaType: SchemaType, path: string[], strict: boolean = false): string {
  const [head, ...tail] = path

  if (!('fields' in schemaType)) {
    return ''
  }

  const schemaField = schemaType.fields.find((field) => field.name === head)
  if (!schemaField) {
    if (!IMPLICIT_SCHEMA_TYPE_FIELDS.includes(head)) {
      const errorMessage = `The current ordering config targeted the nonexistent field "${head}" on schema type "${schemaType.name}". It should be one of ${schemaType.fields.map((field) => field.name).join(', ')}`
      if (strict) {
        throw new Error(errorMessage)
      } else {
        // eslint-disable-next-line no-console
        console.warn(errorMessage)
      }
    }
    return ''
  }

  if ('to' in schemaField.type && schemaField.type.name === 'reference') {
    const refTypes = schemaField.type.to
    return `${head}->{${refTypes.map((refType) => joinReferences(refType, tail)).join(',')}}`
  }

  const tailFields = tail.length > 0 && joinReferences(schemaField.type, tail)
  const tailWrapper = tailFields ? `{${tailFields}}` : ''
  return tail.length > 0 ? `${head}${tailWrapper}` : head
}

export function getExtendedProjection(
  schemaType: SchemaType,
  orderBy: SortOrderingItem[],
  strict: boolean = false,
): string {
  return orderBy
    .map((ordering) => joinReferences(schemaType, ordering.field.split('.'), strict))
    .join(', ')
}
