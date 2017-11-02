import createSchema from 'part:@sanity/base/schema-creator'
import codeInputType from 'part:@sanity/form-builder/input/code/schema'
import schemaTypes from 'all:part:@sanity/base/schema-type'

import book from './book'
import author from './author'

import blocks from './blocks'
import references from './references'
import images, {myImage} from './images'
import strings from './strings'
import objects, {myObject} from './objects'
import arrays from './arrays'
import files from './files'
import uploads from './uploads'
import code from './code'
import recursive from './recursive'
import recursiveArray from './recursiveArray'
import numbers from './numbers'
import booleans from './booleans'
import datetime from './datetime'
import richDateTest from './richDate'
import slugs from './slugs'
import geopoint from './geopoint'

import customInputs from './customInputs'
import notitle from './notitle'
import typeWithNoToplevelStrings from './typeWithNoToplevelStrings'

import richDateType from 'part:@sanity/form-builder/input/rich-date/schema'
import testFocus from './testFocus'

export default createSchema({
  name: 'test-examples',
  types: schemaTypes.concat([
    book,
    author,
    testFocus,
    strings,
    numbers,
    booleans,
    richDateType,
    objects,
    datetime,
    richDateTest,
    arrays,
    uploads,
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
    recursiveArray,
    myObject,
    codeInputType,
    notitle,
    typeWithNoToplevelStrings,
  ])
})
