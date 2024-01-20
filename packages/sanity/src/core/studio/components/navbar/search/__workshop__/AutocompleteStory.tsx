import {Box} from '@sanity/ui'

import {ReferenceAutocomplete} from '../components/filters/filter/inputs/reference/ReferenceAutocomplete'
import {SearchProvider} from '../contexts/search/SearchProvider'

export default function ReferenceAutocompleteStory() {
  return (
    <SearchProvider>
      <Box padding={3}>
        <ReferenceAutocomplete />
      </Box>
    </SearchProvider>
  )
}
