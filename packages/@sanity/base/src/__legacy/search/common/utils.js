const isDocumentType = (type) => type.type && type.type.name === 'document'
const isSanityType = (type) => type.name.startsWith('sanity.')

export const getSearchableTypes = (schema) =>
  schema
    .getTypeNames()
    .map((typeName) => schema.get(typeName))
    .filter((type) => isDocumentType(type) && !isSanityType(type))
