import {dynamicRequire} from './dynamicRequire'

export function lazyRequire(id) {
  return (...args) => {
    const mod = dynamicRequire(id)
    return mod(...args)
  }
}
