import randomKey from './randomKey'

export default function updateKeys(obj: object, keys: string): object {
  for (const prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      switch (typeof obj[prop]) {
        case 'object':
          if (keys.includes(prop)) {
            obj[prop] = randomKey(12)
          } else {
            updateKeys(obj[prop], keys)
          }
          break
        default:
          if (keys.includes(prop)) {
            obj[prop] = randomKey(12)
          }
          break
      }
    }
  }
  return obj
}
