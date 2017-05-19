import createSchema from 'part:@sanity/base/schema-creator'
import {blocksTest, typeWithBlocks} from './blocks'
import myImage from './myImage'
import author from './author'
import blogpost from './blogpost'

export default createSchema({
  name: 'example-blog',
  types: [
    blogpost,
    author,
    blocksTest,
    typeWithBlocks,
    myImage
  ]
})
