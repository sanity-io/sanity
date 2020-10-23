export function getDupes(array, selector = (v) => v) {
  const dupes = array.reduce((acc, item) => {
    const key = selector(item)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)
    return acc
  }, {})

  return Object.keys(dupes)
    .map((key) => (dupes[key].length > 1 ? dupes[key] : null))
    .filter(Boolean)
}
