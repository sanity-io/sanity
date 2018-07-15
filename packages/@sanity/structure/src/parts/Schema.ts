import getDefaultModule from './getDefaultModule'

interface Schema {
  name: string
  get(typeName: string): any
  getTypeNames(): string[]
}

// We are lazy-loading the part to work around typescript trying to resolve it
const defaultSchema = ((): Schema => {
  const schema: Schema = getDefaultModule(require('part:@sanity/base/schema'))
  return schema
})()

export {Schema, defaultSchema}
