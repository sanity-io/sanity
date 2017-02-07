export default function mapToObject(array, producer) {
  return array.reduce((acc, el, i) => {
    const [key, value] = producer(el, i, acc)
    acc[key] = value
    return acc
  }, {})
}
