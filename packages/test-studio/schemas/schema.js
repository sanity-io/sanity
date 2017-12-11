import createSchema from 'part:@sanity/base/schema-creator'
import codeInputType from 'part:@sanity/form-builder/input/code/schema'
import schemaTypes from 'all:part:@sanity/base/schema-type'

import book from './book'
import author from './author'

import blocks from './blocks'
import references from './references'
import images, {myImage} from './images'
import imagePreview from './imagePreview'
import strings from './strings'
import objects, {myObject} from './objects'
import arrays from './arrays'
import files from './files'
import uploads from './uploads'
import code from './code'
import color from './color'
import recursive from './recursive'
import recursiveArray from './recursiveArray'
import numbers from './numbers'
import booleans from './booleans'
import datetime from './datetime'
import richDateTest from './richDate'
import slugs from './slugs'
import geopoint from './geopoint'
import fieldsets from './fieldsets'

import customInputs from './customInputs'
import notitle from './notitle'
import typeWithNoToplevelStrings from './typeWithNoToplevelStrings'

import richDateType from 'part:@sanity/form-builder/input/rich-date/schema'
import focus from './focus'

export default createSchema({
  name: 'test-examples',
  types: schemaTypes.concat([
    book,
    author,
    focus,
    strings,
    numbers,
    booleans,
    richDateType,
    objects,
    fieldsets,
    datetime,
    richDateTest,
    arrays,
    uploads,
    code,
    color,
    images,
    imagePreview,
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
    typeWithNoToplevelStrings
  ])
})
