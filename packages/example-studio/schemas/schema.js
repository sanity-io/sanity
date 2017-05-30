import createSchema from 'part:@sanity/base/schema-creator'
import {blocksTest, typeWithBlocks} from './blocks'
import myImage from './myImage'
import author from './author'
import blogpost from './blogpost'
import code from './code'
import videoEmbed from './videoEmbed'
import localeString from './localeString'

export default createSchema({
  name: 'example-blog',
  types: [
    blogpost,
    code,
    author,
    blocksTest,
    typeWithBlocks,
    myImage,
    videoEmbed,
    localeString
  ]
})
