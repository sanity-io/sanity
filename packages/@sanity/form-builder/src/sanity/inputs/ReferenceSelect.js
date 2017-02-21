import {search, observeReferenceForPreview} from './client-adapters/reference'
import {observeForPreview, prepareForPreview} from 'part:@sanity/base/preview'
import Observable from '@sanity/observable'
import {ReferenceInput} from '../..'

function fetchAllForPreview(referenceType) {
  return Observable.from(search('*', referenceType)).mergeMap(items => {
    return Observable.forkJoin(items.map(item => {
      const memberType = referenceType.to.find(ofType => ofType.type.name === item._type)
      return observeForPreview(item, memberType)
        .map(val => prepareForPreview(val, memberType))
    }))
  })
}

export default ReferenceInput.createSelect({
  fetchAllFn: fetchAllForPreview,
  fetchValueFn: observeReferenceForPreview
})
