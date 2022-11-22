import {LayerProvider} from '@sanity/ui'
import React from 'react'
import {SearchDialog} from '..'
import {SearchProvider} from '../contexts/search/SearchProvider'

const noop = () => null

export default function SearchDialogStory() {
  return (
    <LayerProvider>
      <SearchProvider fullscreen>
        <SearchDialog onClose={noop} onOpen={noop} open />
      </SearchProvider>
    </LayerProvider>
  )
}
