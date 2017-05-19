import React from 'react'
import {search, observeForPreview} from './client-adapters/reference'
import ReferenceBrowser from '../../inputs/Reference/browser/ReferenceBrowser'

export default function SanityReferenceInput(props) {
  return (
    <ReferenceBrowser
      {...props}
      searchFn={search}
      fetchValueFn={observeForPreview}
    />
  )
}

