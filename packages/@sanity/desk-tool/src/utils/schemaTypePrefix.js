export default function schemaTypePrefix(schema) {
  return {
    addTo(document) {
      const typeName = `${schema.name}.${document._type}`
      return Object.assign({}, document, {_type: typeName})
    },
    removeFrom(document) {
      const typeName = document._type
      // not sure if there can be more than one parts after schema name
      const [schemaName, ...rest] = typeName.split('.')
      if (schemaName !== schema.name) {
        throw new Error(`Unexpected schema part of type: "${typeName}". Expected it to begin with "${schema.name}."`)
      }
      return Object.assign({}, document, {_type: rest.join('.')})
    }
  }
}
