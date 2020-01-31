const builtInTypes = ['ID', 'String', 'Url', 'Float', 'Integer', 'Boolean', 'Datetime', 'Date']

const builtInSortingEnum = {
  name: 'SortOrder',
  kind: 'Enum',
  values: [
    {
      name: 'ASC',
      description: 'Sorts on the value in ascending order.',
      value: 1
    },
    {
      name: 'DESC',
      description: 'Sorts on the value in descending order.',
      value: 2
    }
  ]
}

function generateTypeSortings(types) {
  const objectTypes = types.filter(
    type =>
      type.type === 'Object' &&
      !['Block', 'Span'].includes(type.name) && // TODO: What do we do with blocks?
      !type.interfaces &&
      !builtInTypes.includes(type.name)
  )
  const documentTypes = types.filter(
    type => type.type === 'Object' && type.interfaces && type.interfaces.includes('Document')
  )

  const objectTypeSortings = createObjectTypeSortings(objectTypes)
  const documentTypeSortings = createDocumentTypeSortings(documentTypes)

  return objectTypeSortings.concat(documentTypeSortings).concat(builtInSortingEnum)
}

function createObjectTypeSortings(objectTypes) {
  return objectTypes.map(objectType => {
    return {
      name: `${objectType.name}Sorting`,
      kind: 'InputObject',
      fields: objectType.fields
        .filter(field => field.type !== 'JSON' && field.kind !== 'List')
        .map(field => ({
          fieldName: field.fieldName,
          type: builtInTypes.includes(field.type) ? builtInSortingEnum.name : `${field.type}Sorting`
        }))
    }
  })
}

function createDocumentTypeSortings(documentTypes) {
  return documentTypes.map(documentType => {
    const fields = documentType.fields
      .filter(field => field.type !== 'JSON' && field.kind !== 'List')
      .map(field => ({
        fieldName: field.fieldName,
        type: builtInTypes.includes(field.type) ? builtInSortingEnum.name : `${field.type}Sorting`
      }))
    return {
      name: `${documentType.name}Sorting`,
      kind: 'InputObject',
      fields
    }
  })
}

module.exports = generateTypeSortings
