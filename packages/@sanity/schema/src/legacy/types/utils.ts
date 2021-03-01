interface Config {
  enumerable?: boolean
  writable?: boolean
}
export function lazyGetter(target, key, getter, config: Config = {}) {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: config.enumerable !== false,
    get() {
      const val = getter()
      Object.defineProperty(target, key, {
        value: val,
        writable: Boolean(config.writable),
        configurable: false,
      })
      return val
    },
  })
  return target
}

//
// const o = lazyGetter({}, 'expensive', function() {
//   console.log('doing expensive calculations')
//   return 'RESULT OF EXPENSIVE'
// })
//
// console.log(o.expensive)
// console.log(o.expensive)
// console.log(o.expensive)
