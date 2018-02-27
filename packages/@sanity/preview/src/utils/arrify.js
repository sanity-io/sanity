export default function arrify(val) {
  if (Array.isArray(val)) {
    return val
  }
  return typeof val === 'undefined' ? [] : [val]
}
