import {ArrowLeftIcon, ControlsIcon, SearchIcon, SpinnerIcon} from '@sanity/icons'
import {Box, Card, Flex} from '@sanity/ui'
import {forwardRef, type KeyboardEvent, useCallback, useEffect, useRef} from 'react'
import {keyframes, styled} from 'styled-components'

import {Button} from '../../../../../../ui-components'
import {StatusButton} from '../../../../../components'
import {useTranslation} from '../../../../../i18n'
import {useSearchState} from '../contexts/search/useSearchState'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {CustomTextInput} from './common/CustomTextInput'

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const AnimatedSpinnerIcon = styled(SpinnerIcon)`
  animation: ${rotate} 500ms linear infinite;
`

const FilterDiv = styled.div`
  line-height: 0;
  position: relative;
`

interface SearchHeaderProps {
  ariaInputLabel?: string
  onClose?: () => void
}

/**
 * @internal
 */
export const SearchHeader = forwardRef<HTMLInputElement, SearchHeaderProps>(function SearchHeader(
  {ariaInputLabel, onClose},
  ref,
) {
  const isMountedRef = useRef(false)

  const {t} = useTranslation()
  const {
    dispatch,
    state: {
      filters,
      filtersVisible,
      fullscreen,
      result: {loading},
      terms,
    },
  } = useSearchState()
  const {types, query} = terms

  const hasValidTerms = hasSearchableTerms({terms})
  const ariaLabel =
    ariaInputLabel || hasValidTerms
      ? t('search.search-results-aria-label')
      : t('search.recent-searches-aria-label')

  const handleFiltersToggle = useCallback(
    () => dispatch({type: 'FILTERS_VISIBLE_SET', visible: !filtersVisible}),
    [dispatch, filtersVisible],
  )
  const handleQueryChange = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) =>
      dispatch({type: 'TERMS_QUERY_SET', query: e.currentTarget.value}),
    [dispatch],
  )
  const handleQueryClear = useCallback(() => {
    dispatch({type: 'TERMS_QUERY_SET', query: ''})
  }, [dispatch])

  /**
   * Always show filters on non-fullscreen mode
   */
  useEffect(() => {
    if (!fullscreen) {
      dispatch({type: 'FILTERS_VISIBLE_SET', visible: true})
    }
  }, [dispatch, fullscreen])

  useEffect(() => {
    isMountedRef.current = true
  }, [])

  const notificationBadgeVisible = filters.length > 0 || types.length > 0

  return (
    <Card flex="none">
      <Flex align="center" flex={1} gap={fullscreen ? 2 : 1} padding={fullscreen ? 2 : 1}>
        {/* (Fullscreen) Close button */}
        {fullscreen && (
          <Button
            aria-label={t('search.action.close-search-aria-label')}
            icon={ArrowLeftIcon}
            mode="bleed"
            onClick={onClose}
            size="large"
            tooltipProps={{content: t('search.action.close-search-aria-label')}}
          />
        )}

        {/* Search field */}
        <Box flex={1}>
          <CustomTextInput
            __unstable_disableFocusRing
            $background={fullscreen}
            $smallClearButton={fullscreen}
            aria-label={ariaLabel}
            autoComplete="off"
            border={false}
            clearButton={!!query}
            fontSize={[2, 2, 1]}
            icon={loading ? AnimatedSpinnerIcon : SearchIcon}
            onChange={handleQueryChange}
            onClear={handleQueryClear}
            placeholder={t('search.placeholder')}
            radius={2}
            ref={ref}
            spellCheck={false}
            value={query}
          />
        </Box>

        {/* Filter toggle */}
        {fullscreen && (
          <FilterDiv>
            <StatusButton
              aria-expanded={filtersVisible}
              aria-label={t('search.action.toggle-filters-aria-label', {
                context: filtersVisible ? 'hide' : 'show',
              })}
              icon={ControlsIcon}
              mode="bleed"
              onClick={handleFiltersToggle}
              selected={filtersVisible}
              size="large"
              tone={notificationBadgeVisible ? 'primary' : undefined}
              tooltipProps={{
                content: t('search.action.toggle-filters-label', {
                  context: filtersVisible ? 'hide' : 'show',
                }),
              }}
            />
          </FilterDiv>
        )}
      </Flex>
    </Card>
  )
})
