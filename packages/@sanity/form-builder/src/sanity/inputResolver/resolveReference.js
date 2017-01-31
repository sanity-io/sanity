import {ReferenceInput} from '../../index'
import client from 'part:@sanity/base/client'

import {materializeReferences, referenceSearch, fetch} from '../data/fetch'
import {once} from 'lodash'
import {select} from 'part:@sanity/base/preview'
import {unprefixType} from '../utils/unprefixType'

const ReferenceBrowser = ReferenceInput.createBrowser({
  fetch,
  materializeReferences
})

const ReferenceSearchableSelect = ReferenceInput.createSearchableSelect({
  search: referenceSearch,
  _tempResolveRefType: id => client.fetch('*[_id==$id] {_type}', {id})
    .then(res => unprefixType(res[0])._type),
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
