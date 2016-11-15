import {ReferenceInput} from '../../../../src'
import {search, fetch, materializeReferences} from './mock/fetchers'

const ReferenceSearchableSelect = ReferenceInput.createSearchableSelect({
  search,
  materializeReferences
})

const ReferenceBrowser = ReferenceInput.createBrowser({
  fetch,
  materializeReferences
})

const ReferenceSelect = ReferenceInput.createSelect({
  search,
  fetchAll: fetch
})

export default function resolveReferenceInput(field) {
  const fieldOptions = field.options || {}
  if (fieldOptions.inputType === 'select') {
    return fieldOptions.searchable
      ? ReferenceSearchableSelect
      : ReferenceSelect
  }
  return ReferenceBrowser
}
