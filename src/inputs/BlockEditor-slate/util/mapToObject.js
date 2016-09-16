export default function mapToObject(array, iterator) {
  return array.reduce((acc, el, i) => {
    const [key, value] = iterator(el, i, acc)
    acc[key] = value
    return acc
  }, {})
}
