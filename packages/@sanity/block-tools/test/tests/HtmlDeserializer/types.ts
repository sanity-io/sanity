import type {TypedObject} from '../../../src/types'
import {getBlockContentFeatures, normalizeBlock, htmlToBlocks} from '../../../src'

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
