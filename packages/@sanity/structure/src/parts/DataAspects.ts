import {Schema} from './Schema'
import getDefaultModule from './getDefaultModule'

export interface DataAspectsResolver {
  getDisplayName(typeName: string): string
  getDocumentTypes(): string[]
  getInferredTypes(): string[]
}

// We are lazy-loading the part to work around typescript trying to resolve it
export const dataAspects = (() => {
  const Resolver = getDefaultModule(require('part:@sanity/data-aspects/resolver'))
  return (schema: Schema): DataAspectsResolver => new Resolver(schema)
})()
