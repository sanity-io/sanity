import allInputs from './allInputs'
import arrayInArray from './arrayInArray'
import author from './author'
import complexArrays from './complexArrays'
import documentWithViews from './documentWithViews'
import live from './live'
import pt from './pt'
import radioInputs from './radioInputs'
import selectInputs from './selectInputs'
import settings from './settings'

// NOTE: keep this alphabetized
const documentTypes = [
  allInputs,
  arrayInArray,
  author,
  complexArrays,
  documentWithViews,
  live,
  pt,
  radioInputs,
  selectInputs,
  settings,
]

// NOTE: keep this alphabetized
const objectTypes: any[] = []

export const schemaTypes = [...documentTypes, ...objectTypes]
