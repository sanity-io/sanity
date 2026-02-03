import {SearchPopover} from '../components/SearchPopover'
import {SearchProvider} from '../contexts/search/SearchProvider'
import {LayerProvider} from '@sanity/ui'

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
