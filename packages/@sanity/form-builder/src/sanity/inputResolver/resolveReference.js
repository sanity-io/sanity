import {ReferenceInput} from '../../index'
import {materializeReferences, referenceSearch, fetch} from '../data/fetch'
import {once} from 'lodash'
import {select} from 'part:@sanity/base/preview'

const ReferenceBrowser = ReferenceInput.createBrowser({
  fetch,
  materializeReferences
})

const ReferenceSearchableSelect = ReferenceInput.createSearchableSelect({
  search: referenceSearch,
  select: select
})

const ReferenceSelect = ReferenceInput.createSelect({
  fetchAll: fetch,
  materializeReferences
})

// eslint-disable-next-line no-console
const warnNoSearchYet = once(() => console.warn('Reference browser does not yet support search'))

export default function resolveReference(type) {
  const options = type.options || {}
  if (options.inputType === 'select') {
    return options.searchable
      ? ReferenceSearchableSelect
      : ReferenceSelect
  }

  if (options.inputType === 'browser') {
    if (options.searchable) {
      warnNoSearchYet()
    }
    return ReferenceBrowser
  }

  return ReferenceSearchableSelect
}
