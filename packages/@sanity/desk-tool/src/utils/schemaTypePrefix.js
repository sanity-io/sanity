export default function schemaTypePrefix(schema) {

  function add(typeName) {
    return `${schema.name}.${typeName}`
  }

  function remove(typeName) {
    // not sure if there can be more than one parts after schema name
    const [schemaName, ...rest] = typeName.split('.')
    if (schemaName !== schema.name) {
      throw new Error(`Unexpected schema part of type: "${typeName}". Expected it to begin with "${schema.name}."`)
    }
    return rest.join('.')
  }

  return {
    add: add,
    remove: remove,
    addTo(document) {
      return {
        ...document,
        _type: add(document._type)
      }
    },
    removeFrom(document) {
      return {
        ...document,
        _type: remove(document._type)
      }
    }
  }
}
