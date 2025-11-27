import {LayerProvider} from '@sanity/ui'

import {SearchDialog} from '..'
import {SearchProvider} from '../contexts/search/SearchProvider'

const noop = () => null

export default function SearchDialogStory() : React.JSX.Element {
  return (
    <LayerProvider>
      <SearchProvider fullscreen>
        <SearchDialog onClose={noop} onOpen={noop} open />
      </SearchProvider>
    </LayerProvider>
  )
}
