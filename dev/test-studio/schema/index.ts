// Test documents with standard inputs
import arrays, {topLevelArrayType, topLevelPrimitiveArrayType} from './standard/arrays'
import booleans from './standard/booleans'
import date from './standard/date'
import datetime from './standard/datetime'
import emails from './standard/emails'
import files from './standard/files'
import images, {myImage} from './standard/images'
import numbers from './standard/numbers'
import objects, {myObject} from './standard/objects'
import {ptAllTheBellsAndWhistlesType} from './standard/portableText/allTheBellsAndWhistles'
import blocks from './standard/portableText/blocks'
import {ptCustomMarkersTestType} from './standard/portableText/customMarkers'
import richTextObject from './standard/portableText/richTextObject'
import simpleBlock from './standard/portableText/simpleBlock'
import manyEditors from './standard/portableText/manyEditors'
import simpleBlockNote from './standard/portableText/simpleBlockNote'
import simpleBlockNoteBody from './standard/portableText/simpleBlockNoteBody'
import simpleBlockNoteUrl from './standard/portableText/simpleBlockNoteUrl'
import spotifyEmbed from './standard/portableText/spotifyEmbed'
import references from './standard/references'
import slugs from './standard/slugs'
import strings from './standard/strings'
import texts from './standard/texts'
import urls from './standard/urls'

// Test documents for docs
import {v3docs} from './docs/v3'

// Test documents for debugging
import actions from './debug/actions'
import button from './debug/button'
import conditionalFields from './debug/conditionalFields'
import customInputs from './debug/customInputs'
import customNumber from './debug/customNumber'
import {collapsibleObjects} from './debug/collapsibleObjects'
import documentActions from './debug/documentActions'
import empty from './debug/empty'
import experiment from './debug/experiment'
import fieldsets from './debug/fieldsets'
import {
  fieldValidationInferReproSharedObject,
  fieldValidationInferReproDoc,
} from './debug/fieldValidationInferRepro'
import focus from './debug/focus'
import gallery from './debug/gallery'
import {hoistedPt, hoistedPtDocument, customBlock} from './debug/hoistedPt'
import {initialValuesTest, superlatives} from './debug/initialValuesTest'
import invalidPreviews from './debug/invalidPreviews'
import liveEdit from './debug/liveEdit'
import localeString from './debug/localeString'
import notitle from './debug/notitle'
import poppers from './debug/poppers'
import presence, {objectWithNestedArray} from './debug/presence'
import previewImageUrlTest from './debug/previewImageUrlTest'
import {formInputDebug} from './debug/formInputDebug'
import previewMediaTest from './debug/previewMediaTest'
import {previewSelectBugRepro} from './debug/previewSelectBugRepro'
import radio from './debug/radio'
import readOnly from './debug/readOnly'
import recursive from './debug/recursive'
import recursiveArray from './debug/recursiveArray'
import recursiveObjectTest, {recursiveObject} from './debug/recursiveObject'
import recursivePopover from './debug/recursivePopover'
import {simpleArrayOfObjects} from './debug/simpleArrayOfObjects'
import reservedFieldNames from './debug/reservedFieldNames'
import review from './debug/review'
import select from './debug/select'
import typeWithNoToplevelStrings from './debug/typeWithNoToplevelStrings'
import uploads from './debug/uploads'
import validation, {validationArraySuperType} from './debug/validation'
import fieldGroups from './debug/fieldGroups'
import fieldGroupsDefault from './debug/fieldGroupsDefault'
import fieldGroupsMany from './debug/fieldGroupsMany'
import fieldGroupsWithValidation from './debug/fieldGroupsWithValidation'

// Test documents with official plugin inputs
import code from './plugins/code'
import color from './plugins/color'
import geopoint from './plugins/geopoint'
// import {orderableCategoryDocumentType} from './plugins/orderableCategory'
// import {orderableTagDocumentType} from './plugins/orderableTag'

// Test documents with 3rd party plugin inputs
import markdown from './externalPlugins/markdown'
import mux from './externalPlugins/mux'

// Other documents
import author from './author'
import book from './book'
import species from './species'

// CI documents
import conditionalFieldset from './ci/conditionalFieldset'
import validationTest from './ci/validationCI'
import crossDatasetReference, {crossDatasetSubtype} from './standard/crossDatasetReference'
import {circularCrossDatasetReferenceTest} from './debug/circularCrossDatasetReference'

// @todo temporary, until code input is v3 compatible
const codeInputType = {
  name: 'code',
  type: 'object',
  fields: [
    {
      name: 'language',
      title: 'Language',
      type: 'string',
    },
    {
      name: 'filename',
      title: 'Filename',
      type: 'string',
    },
    {
      title: 'Code',
      name: 'code',
      type: 'text',
    },
    {
      title: 'Highlighted lines',
      name: 'highlightedLines',
      type: 'array',
      of: [
        {
          type: 'number',
          title: 'Highlighted line',
        },
      ],
    },
  ],
}

export const schemaTypes = [
  actions,
  arrays,
  author,
  blocks,
  book,
  booleans,
  button,
  code,
  codeInputType, // @todo temporary, until code input is v3 compatible
  color,
  conditionalFields,
  conditionalFieldset,
  customBlock,
  customInputs,
  customNumber,
  date,
  datetime,
  documentActions,
  emails,
  empty,
  experiment,
  fieldValidationInferReproDoc,
  fieldValidationInferReproSharedObject,
  fieldsets,
  files,
  focus,
  gallery,
  geopoint,
  hoistedPt,
  hoistedPtDocument,
  images,
  collapsibleObjects,
  initialValuesTest,
  invalidPreviews,
  liveEdit,
  localeString,
  markdown,
  mux,
  myImage,
  myObject,
  notitle,
  numbers,
  objectWithNestedArray,
  objects,
  formInputDebug,
  // orderableCategoryDocumentType,
  // orderableTagDocumentType,
  manyEditors,
  poppers,
  presence,
  previewImageUrlTest,
  previewMediaTest,
  previewSelectBugRepro,
  ptAllTheBellsAndWhistlesType,
  ptCustomMarkersTestType,
  radio,
  readOnly,
  recursive,
  recursiveArray,
  recursiveObject,
  recursiveObjectTest,
  recursivePopover,
  references,
  crossDatasetReference,
  crossDatasetSubtype,
  circularCrossDatasetReferenceTest,
  reservedFieldNames,
  review,
  richTextObject,
  select,
  simpleBlock,
  simpleBlockNote,
  simpleBlockNoteBody,
  simpleBlockNoteUrl,
  simpleArrayOfObjects,
  slugs,
  species,
  spotifyEmbed,
  strings,
  superlatives,
  texts,
  topLevelArrayType,
  topLevelPrimitiveArrayType,
  typeWithNoToplevelStrings,
  uploads,
  urls,
  validation,
  validationArraySuperType,
  validationTest,
  fieldGroups,
  fieldGroupsDefault,
  fieldGroupsMany,
  fieldGroupsWithValidation,
  ...v3docs.types,
]
