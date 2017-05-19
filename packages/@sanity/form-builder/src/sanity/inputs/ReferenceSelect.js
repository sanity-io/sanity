import React from 'react'
import {search} from './client-adapters/reference'
import {observeForPreview} from 'part:@sanity/base/preview'
import Observable from '@sanity/observable'
import ReferenceSelect from '../../inputs/Reference/select/ReferenceSelect'

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

function fetchValue(value, type) {
  return observeForPreview(value, type).map(result => result.snapshot)
}

export default function SanityReferenceSelect(props) {
  return (
    <ReferenceSelect
      {...props}
      fetchAllFn={fetchAllForPreview}
      fetchValueFn={fetchValue}
    />
  )
}
