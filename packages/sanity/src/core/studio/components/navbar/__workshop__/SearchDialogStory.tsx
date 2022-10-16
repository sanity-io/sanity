import {LayerProvider} from '@sanity/ui'
import React from 'react'
import {SearchDialog} from '../search'
import {SearchProvider} from '../search/contexts/search'

const noop = () => null

export default function SearchDialogStory() {
  return (
    <LayerProvider>
      <SearchProvider>
        <SearchDialog onClose={noop} onOpen={noop} open />
      </SearchProvider>
    </LayerProvider>
  )
}
