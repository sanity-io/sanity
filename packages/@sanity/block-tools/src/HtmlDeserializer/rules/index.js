import createHTMLRules from './html'
import createGDocsRules from './gdocs'
import createWordRules from './word'

export default function createRules(blockContentFeatures) {
  return [
    ...createWordRules(blockContentFeatures),
    ...createGDocsRules(blockContentFeatures),
    ...createHTMLRules(blockContentFeatures)
  ]
}
