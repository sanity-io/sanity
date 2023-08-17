import {Box, Card, Portal} from '@sanity/ui'
import React, {useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled from 'styled-components'
import {supportsTouch} from '../../../../util'
import {useColorScheme} from '../../../colorScheme'
import {useTranslation} from '../../../../i18n'
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

const InnerCard = styled(Card)`
  flex-direction: column;
  overflow: hidden;
  overflow: clip;
  pointer-events: all;
  position: relative;
`

const SearchDialogBox = styled(Box)`
  height: 100%;
  left: 0;
  overflow: hidden;
  overflow: clip;
  pointer-events: none;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1;
`

/**
 * @internal
 */
export function SearchDialog({onClose, onOpen, open}: SearchDialogProps) {
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const {scheme} = useColorScheme()
  const {t} = useTranslation()

  const {
    state: {filtersVisible, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})

  return (
    <SearchWrapper hasValidTerms={hasValidTerms} onClose={onClose} onOpen={onOpen} open={open}>
      <Portal>
        <FocusLock autoFocus={!supportsTouch} returnFocus>
          <SearchDialogBox>
            <InnerCard display="flex" height="fill" scheme={scheme} tone="default">
              <SearchHeader
                ariaInputLabel={
                  hasValidTerms
                    ? t('navbar.search.search-results-label')
                    : t('navbar.search.recent-searches-label')
                }
                onClose={onClose}
                ref={setInputElement}
              />
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
            </InnerCard>
          </SearchDialogBox>
        </FocusLock>
      </Portal>
    </SearchWrapper>
  )
}
