import {allTypes} from './allTypes'
import author from './author'
import book from './book'
import {commentsCI} from './ci/comments'
import conditionalFieldset from './ci/conditionalFieldset'
import validationTest from './ci/validationCI'
import actions from './debug/actions'
import {allFieldsGroupHidden} from './debug/allFieldsGroupHidden'
import {allNativeInputComponents} from './debug/allNativeInputComponents'
import {arrayCapabilities} from './debug/arrayCapabilities'
import button from './debug/button'
import {circularCrossDatasetReferenceTest} from './debug/circularCrossDatasetReference'
import {collapsibleObjects} from './debug/collapsibleObjects'
import {commentsDebug} from './debug/comments'
import conditionalFields from './debug/conditionalFields'
import customInputs from './debug/customInputs'
import customInputsWithPatches from './debug/customInputsWithPatches'
import customNumber from './debug/customNumber'
import dateTimeValidation from './debug/dateTimeValidation'
import dateValidation from './debug/dateValidation'
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
import fieldGroupsWithFieldsetsHidden from './debug/fieldGroupsWithFieldsetsHidden'
import fieldGroupsWithI18n from './debug/fieldGroupsWithI18n'
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
import lazyComponents from './debug/lazyComponents'
import liveEdit from './debug/liveEdit'
import localeString from './debug/localeString'
import manyFieldsTest from './debug/manyFieldsTest'
import {manyViewsType} from './debug/manyViews'
import notitle from './debug/notitle'
import {objectsDebug} from './debug/objectsDebug'
import {patchOnMountDebug} from './debug/patchOnMount'
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
import removeRestoreAction from './debug/removeRestoreAction'
import reservedFieldNames from './debug/reservedFieldNames'
import review from './debug/review'
import * as scrollBugTypes from './debug/scrollBug'
import select from './debug/select'
import {simpleArrayOfObjects} from './debug/simpleArrayOfObjects'
import {simpleReferences} from './debug/simpleReferences'
import typeWithNoToplevelStrings from './debug/typeWithNoToplevelStrings'
import uploads from './debug/uploads'
import validation, {validationArraySuperType} from './debug/validation'
import {virtualizationDebug} from './debug/virtualizationDebug'
import {virtualizationInObject} from './debug/virtualizationInObject'
import {v3docs} from './docs/v3'
import markdown from './externalPlugins/markdown'
import mux from './externalPlugins/mux'
import house from './house'
import playlist from './playlist'
import playlistTrack from './playlistTrack'
import code from './plugins/code'
import color from './plugins/color'
import geopoint from './plugins/geopoint'
import {hotspot, hotspotArrayTest} from './plugins/hotspotArray'
import species from './species'
import arrays, {topLevelArrayType, topLevelPrimitiveArrayType} from './standard/arrays'
import booleans from './standard/booleans'
import crossDatasetReference, {crossDatasetSubtype} from './standard/crossDatasetReference'
import date from './standard/date'
import datetime from './standard/datetime'
import emails from './standard/emails'
import files from './standard/files'
import globalDocumentReference, {
  createGlobalDocumentReferenceSubtype,
} from './standard/globalDocumentReference'
import images, {myImage} from './standard/images'
import numbers from './standard/numbers'
import objects, {myObject} from './standard/objects'
import {ptAllTheBellsAndWhistlesType} from './standard/portableText/allTheBellsAndWhistles'
import blocks from './standard/portableText/blocks'
import {ptCustomBlockEditors} from './standard/portableText/customBlockEditors'
import {ptCustomMarkersTestType} from './standard/portableText/customMarkers'
import {customPlugins} from './standard/portableText/customPlugins'
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
import videos from './standard/videos'
import {elidedValuesExample} from './debug/elidedValues'

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

export function createSchemaTypes(projectId: string) {
  return [
    // Test documents with standard inputs
    arrays,
    topLevelArrayType,
    topLevelPrimitiveArrayType,
    booleans,
    date,
    datetime,
    emails,
    files,
    images,
    videos,
    numbers,
    objects,
    ptAllTheBellsAndWhistlesType,
    blocks,
    ptCustomBlockEditors,
    ptCustomMarkersTestType,
    richTextObject,
    ...Object.values(scrollBugTypes),
    customPlugins,
    simpleBlock,
    manyEditors,
    simpleBlockNote,
    simpleBlockNoteBody,
    simpleBlockNoteUrl,
    spotifyEmbed,
    references,
    referenceAlias,
    slugs,
    slugAlias,
    strings,
    texts,
    urls,

    // Test documents for debugging
    actions,
    button,
    collapsibleObjects,
    commentsDebug,
    conditionalFields,
    customInputs,
    customInputsWithPatches,
    customNumber,
    dateTimeValidation,
    dateValidation,
    deprecatedDocument,
    deprecatedFields,
    documentActions,
    empty,
    experiment,
    fieldActionsTest,
    fieldComponentsTest,
    fieldsets,
    removeRestoreAction,

    fieldValidationInferReproSharedObject,
    fieldValidationInferReproDoc,

    focus,
    gallery,
    hoistedPt,
    hoistedPtDocument,
    customBlock,
    initialValuesTest,
    superlatives,
    inspectorsTestType,
    invalidPreviews,
    languageFilterDebugType,
    lazyComponents,
    liveEdit,
    localeString,
    manyFieldsTest,
    manyViewsType,
    myImage,
    myObject,
    namedDeprecatedObject,
    namedDeprecatedArray,
    notitle,
    objectsDebug,
    poppers,
    presence,
    objectWithNestedArray,
    previewImageUrlTest,
    formInputDebug,
    previewMediaTest,
    previewSelectBugRepro,
    radio,
    readOnly,
    recursive,
    recursiveArray,
    recursiveObjectTest,
    recursiveObject,
    recursivePopover,
    patchOnMountDebug,
    simpleArrayOfObjects,
    arrayCapabilities,
    allFieldsGroupHidden,
    simpleReferences,
    reservedFieldNames,
    review,
    elidedValuesExample,
    select,
    typeWithNoToplevelStrings,
    uploads,
    validation,
    validationArraySuperType,
    fieldGroups,
    fieldGroupsDefault,
    fieldGroupsMany,
    fieldGroupsWithI18n,
    fieldGroupsWithValidation,
    fieldGroupsWithFieldsetsAndValidation,
    fieldGroupsWithFieldsetsHidden,
    virtualizationInObject,
    virtualizationDebug,

    // Test documents with official plugin inputs
    code,
    // @todo temporary, until code input is v3 compatible
    codeInputType,
    color,
    geopoint,
    hotspot,
    hotspotArrayTest,

    // Test documents with 3rd party plugin inputs
    markdown,
    mux,

    // Other documents
    author,
    book,
    species,
    house,
    playlist,
    playlistTrack,

    // CI documents
    allNativeInputComponents,
    allTypes,
    circularCrossDatasetReferenceTest,
    commentsCI,
    conditionalFieldset,
    crossDatasetReference,
    crossDatasetSubtype,
    globalDocumentReference(projectId),
    createGlobalDocumentReferenceSubtype(projectId),
    fieldGroupsWithFieldsets,
    ptReference,
    validationTest,

    // Test documents for docs
    ...v3docs.types,
  ]
}
