// @flow
export default function isUniqueBy<T>(array: Array<T>, keyGen: (element: T) => string) {
  return array.every((element, i) => {
    if (i === 0) {
      return true
    }
    const key = keyGen(element)
    const prevKey = keyGen(array[i-1])
    return key === prevKey
  })
}
