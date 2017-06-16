import createSchema from 'part:@sanity/base/schema-creator'
import code from 'part:@sanity/form-builder/input/code/schema'

import {blocksTest, typeWithBlocks} from './blocks'
import myImage from './myImage'
import author from './author'
import blogpost from './blogpost'
import videoEmbed from './videoEmbed'
import localeString from './localeString'
import protein from './protein'
import proteinTest from './proteinTest'

export default createSchema({
  name: 'example-blog',
  types: [
    blogpost,
    author,
    code,
    blocksTest,
    typeWithBlocks,
    myImage,
    videoEmbed,
    localeString,
    proteinTest,
    protein
  ]
})
