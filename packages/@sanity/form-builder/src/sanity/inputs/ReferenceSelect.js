import {search} from './client-adapters/reference'
import {observeForPreview} from 'part:@sanity/base/preview'
import Observable from '@sanity/observable'
import {ReferenceInput} from '../..'

function fetchAllForPreview(referenceType) {
  return Observable.from(search('*', referenceType))
    .switchMap(items => {
      return Observable.forkJoin(items.map(item => {
        const memberType = referenceType.to.find(ofType => ofType.type.name === item._type)
        return observeForPreview(item, memberType)
          .map(result => result.snapshot)
          .first()
      }))
    })
}

export default ReferenceInput.createSelect({
  fetchAllFn: fetchAllForPreview,
  fetchValueFn: (value, type) => observeForPreview(value, type).map(result => result.snapshot)
})
