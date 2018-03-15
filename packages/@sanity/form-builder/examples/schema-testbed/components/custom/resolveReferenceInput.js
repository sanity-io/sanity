import {ReferenceInput} from '../../../../src'
import {search, fetch, materializeReferences} from './mock/fetchers'

const ReferenceBrowser = ReferenceInput.createBrowser({
  fetch,
  materializeReferences
})

const ReferenceBrowserWithSearch = ReferenceInput.createBrowser({
  search,
  fetch,
  materializeReferences
})

const ReferenceSearchableSelect = ReferenceInput.createSearchableSelect({
  search,
  materializeReferences
})

const ReferenceSelect = ReferenceInput.createSelect({
  fetchAll: fetch,
  materializeReferences
})

export default function resolveReference(field) {
  const fieldOptions = field.options || {}
  if (fieldOptions.inputType === 'select') {
    return fieldOptions.searchable ? ReferenceSearchableSelect : ReferenceSelect
  }

  if (fieldOptions.inputType === 'browser') {
    return fieldOptions.searchable ? ReferenceBrowserWithSearch : ReferenceBrowser
  }

  return ReferenceSearchableSelect
}
