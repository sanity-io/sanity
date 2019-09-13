import {BlockContentFeatures} from '../typeDefs'

export default function buildEditorSchema(
  blockContentFeatures: BlockContentFeatures,
  options: {withNormalization: boolean} = {withNormalization: true}
) {
  const blocks = {__unknown: {isVoid: true}}
  blockContentFeatures.types.blockObjects.forEach(type => {
    blocks[type.name] = {isVoid: true}
  })
  const inlines = {}
  blockContentFeatures.types.inlineObjects.forEach(type => {
    inlines[type.name] = {isVoid: true}
  })

  return {
    blocks,
    inlines,
    document: {}
  }
}
