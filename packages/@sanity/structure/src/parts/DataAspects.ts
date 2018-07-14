import {Schema} from './schema'

interface DataAspectsResolver {
  getDisplayName(typeName: string): string
  getInferredTypes(): string[]
}

// We are lazy-loading the part to work around typescript trying to resolve it
export const dataAspects = (() => {
  const Resolver = require('part:@sanity/data-aspects/resolver')
  return (schema: Schema): DataAspectsResolver => new Resolver(schema)
})()
