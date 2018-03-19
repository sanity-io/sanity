import createDefaultRules from './default'
import createMiscRules from './misc'
import createWordRules from './word'

export default function createRules(blockContentType, options = {}) {
  return [
    ...createMiscRules(blockContentType, options),
    ...createWordRules(blockContentType, options),
    ...createDefaultRules(blockContentType, options)
  ]
}
