import dynamicRequire from './dynamicRequire'

export default (id) => (...args) => {
  const mod = dynamicRequire(id)
  return mod(...args)
}
