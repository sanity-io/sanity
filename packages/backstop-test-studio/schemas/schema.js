import createSchema from 'part:@sanity/base/schema-creator'
import schemaTypes from 'all:part:@sanity/base/schema-type'

import arrays, {topLevelArrayType, topLevelPrimitiveArrayType} from './arrays'
import blocks from './blocks'
import code from './code'
import date from './date'
import color from './color'
import booleans from './booleans'
import texts from './texts'
import book from './book'
import author from './author'
import images, {myImage} from './images'
import objects, {myObject} from './objects'
import species from './species'
import readOnly from './readOnly'
import notitle from './notitle'
import empty from './empty'
import invalidPreviews from './invalidPreviews'
import validation from './validation'
import references from './references'
import geopoint from './geopoint'
import typeWithNoToplevelStrings from './typeWithNoToplevelStrings'

export default createSchema({
  name: 'test-examples',
  types: schemaTypes.concat([
    book,
    author,
    arrays,
    code,
    color,
    blocks,
    date,
    texts,
    species,
    images,
    readOnly,
    references,
    geopoint,
    notitle,
    empty,
    myImage,
    objects,
    myObject,
    booleans,
    validation,
    topLevelArrayType,
    topLevelPrimitiveArrayType,
    invalidPreviews,
    typeWithNoToplevelStrings
  ])
})
