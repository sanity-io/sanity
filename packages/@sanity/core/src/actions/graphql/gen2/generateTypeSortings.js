const builtInTypes = [
  'Boolean',
  'Date',
  'Datetime',
  'Email',
  'Float',
  'ID',
  'Integer',
  'String',
  'Text',
  'Url',
]

const builtInSortingEnum = {
  name: 'SortOrder',
  kind: 'Enum',
  values: [
    {
      name: 'ASC',
      description: 'Sorts on the value in ascending order.',
      value: 1,
    },
    {
      name: 'DESC',
      description: 'Sorts on the value in descending order.',
      value: 2,
    },
  ],
}

function generateTypeSortings(types) {
  const objectTypes = types.filter(
    (type) =>
      type.type === 'Object' &&
      !['Block', 'Span'].includes(type.name) && // TODO: What do we do with blocks?
      !type.interfaces &&
      !builtInTypes.includes(type.name)
  )
  const documentTypes = types.filter(
    (type) =>
      type.name === 'Document' ||
      (type.type === 'Object' && type.interfaces && type.interfaces.includes('Document'))
  )

  const hasFields = (type) => type.fields.length > 0

  const objectTypeSortings = createObjectTypeSortings(objectTypes)
  const documentTypeSortings = createDocumentTypeSortings(documentTypes)
  const allSortings = [].concat(objectTypeSortings, documentTypeSortings).filter(hasFields)

  return allSortings.concat(builtInSortingEnum)
}

function createObjectTypeSortings(objectTypes) {
  return objectTypes.map((objectType) => ({
    name: `${objectType.name}Sorting`,
    kind: 'InputObject',
    fields: objectType.fields
      .filter((field) => field.type !== 'JSON' && field.kind !== 'List')
      .filter((field) => !field.isReference)
      .map((field) => ({
        fieldName: field.fieldName,
        type: builtInTypes.includes(field.type) ? builtInSortingEnum.name : `${field.type}Sorting`,
      })),
  }))
}

function createDocumentTypeSortings(documentTypes) {
  return documentTypes.map((documentType) => ({
    name: `${documentType.name}Sorting`,
    kind: 'InputObject',
    fields: documentType.fields
      .filter((field) => field.type !== 'JSON' && field.kind !== 'List')
      .filter((field) => !field.isReference)
      .map((field) => ({
        fieldName: field.fieldName,
        type: builtInTypes.includes(field.type) ? builtInSortingEnum.name : `${field.type}Sorting`,
      })),
  }))
}

module.exports = generateTypeSortings
