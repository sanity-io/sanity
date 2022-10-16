import {LayerProvider} from '@sanity/ui'
import React from 'react'
import {SearchField} from '../search'
import {SearchProvider} from '../search/contexts/search'

export default function SearchFieldStory() {
  return (
    <LayerProvider>
      <SearchProvider>
        <SearchField />
      </SearchProvider>
    </LayerProvider>
  )
}
