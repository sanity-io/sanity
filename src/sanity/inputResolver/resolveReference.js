import {ReferenceInput} from '../../index'
import {materializeReferences, search, fetch} from '../data/fetch'

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
  fetch,
  materializeReferences
})

const ReferenceSelect = ReferenceInput.createSelect({
  fetchAll: fetch,
  materializeReferences
})

export default function resolveReference(field) {
  const fieldOptions = field.options || {}
  if (fieldOptions.inputType === 'select') {
    return fieldOptions.searchable
      ? ReferenceSearchableSelect
      : ReferenceSelect
  }

  if (fieldOptions.inputType === 'browser') {
    return fieldOptions.searchable
      ? ReferenceBrowserWithSearch
      : ReferenceBrowser
  }

  return ReferenceSearchableSelect
}
