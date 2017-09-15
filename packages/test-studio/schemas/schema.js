import createSchema from 'part:@sanity/base/schema-creator'
import codeInputType from 'part:@sanity/form-builder/input/code/schema'

import book from './book'
import author from './author'

import blocks from './blocks'
import references from './references'
import images, {myImage} from './images'
import strings from './strings'
import objects, {myObject} from './objects'
import arrays from './arrays'
import files from './files'
import code from './code'
import recursive from './recursive'
import numbers from './numbers'
import booleans from './booleans'
import dates from './dates'
import slugs from './slugs'
import geopoint from './geopoint'
import customInputs from './customInputs'
import notitle from './notitle'

export default createSchema({
  name: 'test-examples',
  types: [
    book,
    author,
    strings,
    numbers,
    booleans,
    objects,
    dates,
    arrays,
    code,
    images,
    files,
    references,
    geopoint,
    blocks,
    slugs,
    customInputs,
    myImage,
    recursive,
    myObject,
    codeInputType,
    notitle
  ]
})
