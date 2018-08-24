import {SchemaType} from '../parts/Schema'
import {SortItem} from '../Sort'

const IMPLICIT_FIELDS = ['_id', '_type', '_createdAt', '_updatedAt', '_rev']

// Takes a path array and a schema type and builds a GROQ join every time it enters a reference field
function joinReferences(schemaType: SchemaType, path: string[]): string {
  const [head, ...tail] = path

  if (!schemaType.fields) {
    return ''
  }

  const schemaField = schemaType.fields.find(field => field.name === head)
  if (!schemaField) {
    if (!IMPLICIT_FIELDS.includes(head)) {
      // eslint-disable-next-line no-console
      console.warn(
        'The current ordering config targeted the nonexistent field "%s" on schema type "%s". It should be one of %o',
        head,
        schemaType.name,
        schemaType.fields.map(field => field.name)
      )
    }
    return ''
  }

  if (schemaField.type.name === 'reference' && schemaField.type.to) {
    const refTypes = schemaField.type.to
    return `${head}->{${refTypes.map(refType => joinReferences(refType, tail)).join(',')}}`
  }

  return head
}

export function getExtendedProjection(schemaType: SchemaType, orderBy: SortItem[]): string {
  return orderBy.map(ordering => joinReferences(schemaType, ordering.field.split('.'))).join(', ')
}
