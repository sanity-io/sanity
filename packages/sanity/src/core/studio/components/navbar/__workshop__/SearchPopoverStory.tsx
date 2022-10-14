import {LayerProvider} from '@sanity/ui'
import React from 'react'
import {SearchPopover} from '../search/components/SearchPopover'
import {SearchProvider} from '../search/contexts/search'

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
          position={{x: 0, y: 0}}
        />
      </SearchProvider>
    </LayerProvider>
  )
}
