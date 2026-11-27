import {type StackablePerspective} from '@sanity/client'
import {Card, Portal} from '@sanity/ui'
import {useState} from 'react'
import FocusLock from 'react-focus-lock'
import {Box} from 'ui5'

import {supportsTouch} from '../../../../util/supportsTouch'
import {useColorSchemeValue} from '../../../colorScheme'
import {Filters} from './components/filters/Filters'
import {RecentSearches} from './components/recentSearches/RecentSearches'
import {SearchHeader} from './components/SearchHeader'
import {SearchResults} from './components/searchResults/SearchResults'
import {useSearchState} from './contexts/search/useSearchState'
import {innerCard, searchDialogBox} from './SearchDialog.css'
import {hasSearchableTerms} from './utils/hasSearchableTerms'

interface SearchDialogContentProps {
  onClose: () => void
  previewPerspective?: StackablePerspective[]
  previewVariant?: string
}

/**
 * The open fullscreen search: the search field, the filters and the results or recent searches.
 * Loaded once the dialog first opens.
 */
export default function SearchDialogContent({
  onClose,
  previewPerspective,
  previewVariant,
}: SearchDialogContentProps) {
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const scheme = useColorSchemeValue()

  const {
    state: {filtersVisible, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})

  return (
    <Portal>
      <FocusLock autoFocus={!supportsTouch} returnFocus>
        <Box className={searchDialogBox}>
          <Card className={innerCard} display="flex" height="fill" scheme={scheme} tone="default">
            <SearchHeader onClose={onClose} ref={setInputElement} />
            {filtersVisible && (
              <Card borderTop flex="none">
                <Filters />
              </Card>
            )}
            {hasValidTerms ? (
              <SearchResults
                inputElement={inputElement}
                previewPerspective={previewPerspective}
                previewVariant={previewVariant}
              />
            ) : (
              <RecentSearches inputElement={inputElement} />
            )}
          </Card>
        </Box>
      </FocusLock>
    </Portal>
  )
}
