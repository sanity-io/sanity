import {type getBlockContentFeatures, type htmlToBlocks, type normalizeBlock} from '../../../src'
import {type TypedObject} from '../../../src/types'

interface BlockContentFunctions {
  getBlockContentFeatures: typeof getBlockContentFeatures
  normalizeBlock: typeof normalizeBlock
  htmlToBlocks: typeof htmlToBlocks
}

export type BlockTestFn = (
  input: string,
  blockTools: BlockContentFunctions,
  commonOptions: {parseHtml: (html: string) => Document},
) => TypedObject[]
