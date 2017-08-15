import createSchema from 'part:@sanity/base/schema-creator'
import code from 'part:@sanity/form-builder/input/code/schema'

import {blocksTest, typeWithBlocks} from './blocks'
import myImage from './myImage'
import author from './author'
import blogpost from './blogpost'
import videoEmbed from './videoEmbed'
import localeString from './localeString'
import localeSlug from './localeSlug'
import protein from './protein'
import proteinTest from './proteinTest'
import referenceTest from './referenceTest'
import imagesTest from './imagesTest'
import strings from './strings'
import arrays from './arrays'

export default createSchema({
  name: 'example-blog',
  types: [
    blogpost,
    author,
    strings,
    arrays,
    code,
    blocksTest,
    typeWithBlocks,
    myImage,
    imagesTest,
    videoEmbed,
    localeString,
    localeSlug,
    proteinTest,
    protein,
    referenceTest
  ]
})
