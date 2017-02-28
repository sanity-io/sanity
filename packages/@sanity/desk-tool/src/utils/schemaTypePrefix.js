export default function schemaTypePrefix(schema) {

  function add(typeName) {
    return typeName
  }

  function remove(typeName) {
    return typeName
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
