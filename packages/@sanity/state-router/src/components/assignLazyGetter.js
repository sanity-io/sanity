// todo: remove this
export default function assignLazyGetter(target, key, getter) {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get() {
      const val = getter()
      Object.defineProperty(target, key, {
        value: val,
        writable: false,
        configurable: false
      })
      return val
    }
  })
  return target
}
