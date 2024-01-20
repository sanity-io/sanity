// Test documents with standard inputs
import {allTypes} from './allTypes'
import author from './author'
import book from './book'
import conditionalFieldset from './ci/conditionalFieldset'
import validationTest from './ci/validationCI'
import actions from './debug/actions'
import {allNativeInputComponents} from './debug/allNativeInputComponents'
import button from './debug/button'
import {circularCrossDatasetReferenceTest} from './debug/circularCrossDatasetReference'
import {collapsibleObjects} from './debug/collapsibleObjects'
import {commentsDebug} from './debug/comments'
import conditionalFields from './debug/conditionalFields'
import customInputs from './debug/customInputs'
import customInputsWithPatches from './debug/customInputsWithPatches'
import customNumber from './debug/customNumber'
import {deprecatedDocument} from './debug/deprecatedDocument'
import {
  deprecatedFields,
  namedDeprecatedArray,
  namedDeprecatedObject,
} from './debug/deprecatedFields'
import documentActions from './debug/documentActions'
import empty from './debug/empty'
import experiment from './debug/experiment'
import {fieldActionsTest} from './debug/fieldActionsTest'
import fieldComponentsTest from './debug/fieldComponentsTest'
import fieldGroups from './debug/fieldGroups'
import fieldGroupsDefault from './debug/fieldGroupsDefault'
import fieldGroupsMany from './debug/fieldGroupsMany'
import fieldGroupsWithFieldsets from './debug/fieldGroupsWithFieldsets'
import fieldGroupsWithFieldsetsAndValidation from './debug/fieldGroupsWithFieldsetsAndValidation'
import fieldGroupsWithValidation from './debug/fieldGroupsWithValidation'
import fieldsets from './debug/fieldsets'
import {
  fieldValidationInferReproDoc,
  fieldValidationInferReproSharedObject,
} from './debug/fieldValidationInferRepro'
import focus from './debug/focus'
import {formInputDebug} from './debug/formInputDebug'
import gallery from './debug/gallery'
import {customBlock, hoistedPt, hoistedPtDocument} from './debug/hoistedPt'
import {initialValuesTest, superlatives} from './debug/initialValuesTest'
import {inspectorsTestType} from './debug/inspectors'
import invalidPreviews from './debug/invalidPreviews'
import {languageFilterDebugType} from './debug/languageFilter'
import liveEdit from './debug/liveEdit'
import localeString from './debug/localeString'
import manyFieldsTest from './debug/manyFieldsTest'
import notitle from './debug/notitle'
import poppers from './debug/poppers'
import presence, {objectWithNestedArray} from './debug/presence'
import previewImageUrlTest from './debug/previewImageUrlTest'
import previewMediaTest from './debug/previewMediaTest'
import {previewSelectBugRepro} from './debug/previewSelectBugRepro'
import ptReference from './debug/ptReference'
import radio from './debug/radio'
import readOnly from './debug/readOnly'
import recursive from './debug/recursive'
import recursiveArray from './debug/recursiveArray'
import recursiveObjectTest, {recursiveObject} from './debug/recursiveObject'
import recursivePopover from './debug/recursivePopover'
import reservedFieldNames from './debug/reservedFieldNames'
import review from './debug/review'
import * as scrollBugTypes from './debug/scrollBug'
import select from './debug/select'
import {simpleArrayOfObjects} from './debug/simpleArrayOfObjects'
// Test documents for docs
// Demo documents for 3d experiments
// Test documents for debugging
import {simpleReferences} from './debug/simpleReferences'
import typeWithNoToplevelStrings from './debug/typeWithNoToplevelStrings'
import uploads from './debug/uploads'
import validation, {validationArraySuperType} from './debug/validation'
import {virtualizationDebug} from './debug/virtualizationDebug'
import {virtualizationInObject} from './debug/virtualizationInObject'
import {demos3d} from './demos/3d'
import {v3docs} from './docs/v3'
// import {orderableCategoryDocumentType} from './plugins/orderableCategory'
// import {orderableTagDocumentType} from './plugins/orderableTag'
// Test documents with 3rd party plugin inputs
import markdown from './externalPlugins/markdown'
import mux from './externalPlugins/mux'
import playlist from './playlist'
import playlistTrack from './playlistTrack'
// Test documents with official plugin inputs
import code from './plugins/code'
import color from './plugins/color'
import geopoint from './plugins/geopoint'
// Other documents
import species from './species'
import arrays, {topLevelArrayType, topLevelPrimitiveArrayType} from './standard/arrays'
import booleans from './standard/booleans'
// CI documents
import crossDatasetReference, {crossDatasetSubtype} from './standard/crossDatasetReference'
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
import manyEditors from './standard/portableText/manyEditors'
import richTextObject from './standard/portableText/richTextObject'
import simpleBlock from './standard/portableText/simpleBlock'
import simpleBlockNote from './standard/portableText/simpleBlockNote'
import simpleBlockNoteBody from './standard/portableText/simpleBlockNoteBody'
import simpleBlockNoteUrl from './standard/portableText/simpleBlockNoteUrl'
import spotifyEmbed from './standard/portableText/spotifyEmbed'
import references, {referenceAlias} from './standard/references'
import slugs, {slugAlias} from './standard/slugs'
import strings from './standard/strings'
import texts from './standard/texts'
import urls from './standard/urls'

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
  commentsDebug,
  conditionalFields,
  conditionalFieldset,
  customBlock,
  customInputs,
  customInputsWithPatches,
  customNumber,
  date,
  datetime,
  deprecatedFields,
  deprecatedDocument,
  documentActions,
  emails,
  empty,
  experiment,
  fieldActionsTest,
  fieldComponentsTest,
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
  languageFilterDebugType,
  liveEdit,
  localeString,
  manyFieldsTest,
  markdown,
  mux,
  myImage,
  myObject,
  namedDeprecatedObject,
  namedDeprecatedArray,
  notitle,
  numbers,
  objectWithNestedArray,
  objects,
  formInputDebug,
  // orderableCategoryDocumentType,
  // orderableTagDocumentType,
  manyEditors,
  playlist,
  playlistTrack,
  poppers,
  presence,
  previewImageUrlTest,
  previewMediaTest,
  previewSelectBugRepro,
  ptAllTheBellsAndWhistlesType,
  ptCustomMarkersTestType,
  ptReference,
  radio,
  readOnly,
  recursive,
  recursiveArray,
  recursiveObject,
  recursiveObjectTest,
  recursivePopover,
  references,
  referenceAlias,
  crossDatasetReference,
  crossDatasetSubtype,
  circularCrossDatasetReferenceTest,
  reservedFieldNames,
  review,
  richTextObject,
  ...Object.values(scrollBugTypes),
  select,
  simpleBlock,
  simpleBlockNote,
  simpleBlockNoteBody,
  simpleBlockNoteUrl,
  simpleArrayOfObjects,
  simpleReferences,
  slugs,
  slugAlias,
  species,
  spotifyEmbed,
  strings,
  superlatives,
  inspectorsTestType,
  texts,
  topLevelArrayType,
  topLevelPrimitiveArrayType,
  typeWithNoToplevelStrings,
  uploads,
  urls,
  validation,
  validationArraySuperType,
  validationTest,
  virtualizationDebug,
  virtualizationInObject,
  fieldGroups,
  fieldGroupsDefault,
  fieldGroupsMany,
  fieldGroupsWithValidation,
  fieldGroupsWithFieldsets,
  fieldGroupsWithFieldsetsAndValidation,
  allNativeInputComponents,
  allTypes,
  ...v3docs.types,
  ...demos3d.types,
]
