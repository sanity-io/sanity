import {LayerProvider} from '@sanity/ui'
import React from 'react'
import {SearchPopover} from '../components/SearchPopover'
import {SearchProvider} from '../contexts/search/SearchProvider'

const noop = () => null

export default function SearchFieldStory() {
  return (
    <LayerProvider>
      <SearchProvider>
        <SearchPopover
          disableFocusLock // required to prevent clashing with existing search
          onClose={noop}
          onOpen={noop}
          open
        />
      </SearchProvider>
    </LayerProvider>
  )
}
