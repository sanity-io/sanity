import {dynamicRequire} from './dynamicRequire'

export function lazyRequire(id: string) {
  return (...args: any[]) => {
    const mod = dynamicRequire(id)
    return mod(...args)
  }
}
