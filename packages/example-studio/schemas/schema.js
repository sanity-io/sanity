import createSchema from 'part:@sanity/base/schema-creator'
import schemaTypes from 'all:part:@sanity/base/schema-type'
import code from 'part:@sanity/form-builder/input/code/schema'

import author from './author'
import blogpost from './blogpost'
import videoEmbed from './videoEmbed'
import localeString from './localeString'
import localeSlug from './localeSlug'
import proteinTest from './proteinTest'
import customObject from './customObject'
import richText from './richText'
import protein from '../components/ProteinInput/schema'
import orderLines from '../components/OrderLinesInput/schema'
import invoice from './invoice'

export default createSchema({
  name: 'example-blog',
  types: schemaTypes.concat([
    blogpost,
    author,
    code,
    orderLines,
    customObject,
    localeString,
    localeSlug,
    videoEmbed,
    proteinTest,
    protein,
    richText,
    invoice
  ])
})
