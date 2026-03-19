import {Box, Card, Portal} from '@sanity/ui'
import {useState} from 'react'
import FocusLock from 'react-focus-lock'

import {supportsTouch} from '../../../../util'
import {useColorSchemeValue} from '../../../colorScheme'
import {SearchWrapper} from './components/common/SearchWrapper'
import {Filters} from './components/filters/Filters'
import {RecentSearches} from './components/recentSearches/RecentSearches'
import {SearchHeader} from './components/SearchHeader'
import {SearchResults} from './components/searchResults/SearchResults'
import {useSearchState} from './contexts/search/useSearchState'
import {hasSearchableTerms} from './utils/hasSearchableTerms'

interface SearchDialogProps {
  onClose: () => void
  onOpen: () => void
  open: boolean
}

import {innerCard, searchDialogBox} from './SearchDialog.css'

/**
 * @internal
 */
export function SearchDialog({onClose, onOpen, open}: SearchDialogProps) {
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const scheme = useColorSchemeValue()

  const {
    state: {filtersVisible, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})

  return (
    <SearchWrapper hasValidTerms={hasValidTerms} onClose={onClose} onOpen={onOpen} open={open}>
      {open && (
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
                  <SearchResults inputElement={inputElement} />
                ) : (
                  <RecentSearches inputElement={inputElement} />
                )}
              </Card>
            </Box>
          </FocusLock>
        </Portal>
      )}
    </SearchWrapper>
  )
}
