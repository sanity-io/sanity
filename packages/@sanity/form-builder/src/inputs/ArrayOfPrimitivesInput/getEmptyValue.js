export default function getEmptyValue(type) {
  switch (type.jsonType) {
    case 'string': {
      return ''
    }
    case 'number': {
      return 0
    }
    case 'boolean': {
      return false
    }
    default:
      return undefined
  }
}
