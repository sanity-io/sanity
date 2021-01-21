import createSchema from 'part:@sanity/base/schema-creator'
import codeInputType from 'part:@sanity/form-builder/input/code/schema'
import schemaTypes from 'all:part:@sanity/base/schema-type'

import simpleBlock from './simpleBlock'
import simpleBlockNote from './simpleBlockNote'
import simpleBlockNoteBody from './simpleBlockNoteBody'
import simpleBlockNoteUrl from './simpleBlockNoteUrl'
import book from './book'
import author from './author'
import blocks from './blocks'
import references from './references'
import images, {myImage} from './images'
import strings from './strings'
import emails from './emails'
import urls from './urls'
import texts from './texts'
import objects, {myObject} from './objects'
import recursiveObjectTest, {recursiveObject} from './recursiveObject'
import arrays, {topLevelArrayType, topLevelPrimitiveArrayType} from './arrays'
import files from './files'
import uploads from './uploads'
import code from './code'
import customNumber from './customNumber'
import localeString from './localeString'
import color from './color'
import liveEdit from './liveEdit'
import recursive from './recursive'
import recursiveArray from './recursiveArray'
import recursivePopover from './recursivePopover'
import numbers from './numbers'
import booleans from './booleans'
import datetime from './datetime'
import slugs from './slugs'
import spotifyEmbed from './spotifyEmbed'
import geopoint from './geopoint'
import fieldsets from './fieldsets'
import empty from './empty'
import readOnly from './readOnly'
import validation, {validationArraySuperType} from './validation'
import experiment from './experiment'
import customInputs from './customInputs'
import notitle from './notitle'
import typeWithNoToplevelStrings from './typeWithNoToplevelStrings'

import focus from './focus'
import previewImageUrlTest from './previewImageUrlTest'
import previewMediaTest from './previewMediaTest'
import species from './species'
import date from './date'
import invalidPreviews from './invalidPreviews'
import actions from './actions'
import reservedFieldNames from './reservedFieldNames'
import button from './button'
import richTextObject from './richTextObject'
import mux from './mux'
import review from './review'
import gallery from './gallery'
import presence, {objectWithNestedArray} from './presence'
import {customBlock, hoistedPt, hoistedPtDocument} from './hoistedPt'

export default createSchema({
  name: 'test-examples',
  types: schemaTypes.concat([
    objectWithNestedArray,
    book,
    author,
    presence,
    species,
    spotifyEmbed,
    focus,
    strings,
    emails,
    urls,
    texts,
    numbers,
    customNumber,
    booleans,
    objects,
    fieldsets,
    datetime,
    date,
    validationArraySuperType,
    validation,
    actions,
    topLevelArrayType,
    topLevelPrimitiveArrayType,
    arrays,
    uploads,
    code,
    color,
    liveEdit,
    images,
    files,
    experiment,
    references,
    geopoint,
    blocks,
    slugs,
    customInputs,
    myImage,
    localeString,
    recursive,
    recursiveArray,
    recursivePopover,
    recursiveObjectTest,
    recursiveObject,
    myObject,
    codeInputType,
    notitle,
    typeWithNoToplevelStrings,
    reservedFieldNames,
    previewImageUrlTest,
    previewMediaTest,
    invalidPreviews,
    readOnly,
    empty,
    richTextObject,
    button,
    mux,
    review,
    gallery,
    simpleBlock,
    simpleBlockNote,
    simpleBlockNoteBody,
    simpleBlockNoteUrl,
    hoistedPtDocument,
    hoistedPt,
    customBlock,
  ]),
})
