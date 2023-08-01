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
import references, {referenceAlias} from './standard/references'
import slugs, {slugAlias} from './standard/slugs'
import strings from './standard/strings'
import texts from './standard/texts'
import urls from './standard/urls'

// Test documents for docs
import {v3docs} from './docs/v3'
// Demo documents for 3d experiments
import {demos3d} from './demos/3d'

// Test documents for debugging
import * as scrollBugTypes from './debug/scrollBug'
import actions from './debug/actions'
import button from './debug/button'
import conditionalFields from './debug/conditionalFields'
import customInputs from './debug/customInputs'
import customInputsWithPatches from './debug/customInputsWithPatches'
import customNumber from './debug/customNumber'
import {collapsibleObjects} from './debug/collapsibleObjects'
import documentActions from './debug/documentActions'
import empty from './debug/empty'
import experiment from './debug/experiment'
import {fieldActionsTest} from './debug/fieldActionsTest'
import fieldComponentsTest from './debug/fieldComponentsTest'
import fieldsets from './debug/fieldsets'
import {
  fieldValidationInferReproSharedObject,
  fieldValidationInferReproDoc,
} from './debug/fieldValidationInferRepro'
import focus from './debug/focus'
import gallery from './debug/gallery'
import {hoistedPt, hoistedPtDocument, customBlock} from './debug/hoistedPt'
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
import {simpleReferences} from './debug/simpleReferences'
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
import fieldGroupsWithFieldsetsAndValidation from './debug/fieldGroupsWithFieldsetsAndValidation'
import {virtualizationInObject} from './debug/virtualizationInObject'
import {virtualizationDebug} from './debug/virtualizationDebug'

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
import playlist from './playlist'
import playlistTrack from './playlistTrack'

// CI documents
import conditionalFieldset from './ci/conditionalFieldset'
import validationTest from './ci/validationCI'
import crossDatasetReference, {crossDatasetSubtype} from './standard/crossDatasetReference'
import {circularCrossDatasetReferenceTest} from './debug/circularCrossDatasetReference'
import {allNativeInputComponents} from './debug/allNativeInputComponents'
import fieldGroupsWithFieldsets from './debug/fieldGroupsWithFieldsets'
import ptReference from './debug/ptReference'

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
  customInputsWithPatches,
  customNumber,
  date,
  datetime,
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
  ...v3docs.types,
  ...demos3d.types,
]
