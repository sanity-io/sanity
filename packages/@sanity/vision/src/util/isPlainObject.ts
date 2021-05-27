export default function isPlainObject(obj) {
  return (
    !!obj && typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Object]'
  )
}
