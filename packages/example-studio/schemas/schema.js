import createSchema from 'part:@sanity/base/schema-creator'
import code from 'part:@sanity/form-builder/input/code/schema'

import author from './author'
import blogpost from './blogpost'
import videoEmbed from './videoEmbed'
import localeString from './localeString'
import localeSlug from './localeSlug'
import protein from './protein'
import customObject from './customObject'

export default createSchema({
  name: 'example-blog',
  types: [
    blogpost,
    author,
    code,
    customObject,
    localeString,
    localeSlug,
    videoEmbed,
    protein
  ]
})
