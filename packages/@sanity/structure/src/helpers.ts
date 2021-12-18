import {Schema, SchemaType} from '@sanity/types'

const BUNDLED_DOC_TYPES = ['sanity.imageAsset', 'sanity.fileAsset']

function isDocumentType(schemaType: SchemaType) {
  return schemaType.type?.name === 'document'
}

function isBundledDocType(typeName: string) {
  return BUNDLED_DOC_TYPES.includes(typeName)
}

export function getSchemaTypes(schema: Schema): string[] {
  const typeNames = schema.getTypeNames()

  return typeNames
    .filter((n) => {
      const schemaType = schema.get(n)

      return schemaType && isDocumentType(schemaType)
    })
    .filter((n) => {
      return !isBundledDocType(n)
    })
}
