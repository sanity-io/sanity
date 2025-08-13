import {LayerProvider} from '@sanity/ui'

import {SearchProvider} from '../contexts/search/SearchProvider'
import {SearchDialog} from '../SearchDialog'

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
