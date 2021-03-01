import createHTMLRules from './html'
import createGDocsRules from './gdocs'
import createWordRules from './word'

export default function createRules(blockContentType, options = {}) {
  return [
    ...createWordRules(blockContentType, options),
    ...createGDocsRules(blockContentType, options),
    ...createHTMLRules(blockContentType, options),
  ]
}
