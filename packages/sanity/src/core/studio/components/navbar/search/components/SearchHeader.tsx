import {ArrowLeftIcon, ControlsIcon, SearchIcon, SpinnerIcon} from '@sanity/icons'
import {Box, Card, Flex} from '@sanity/ui'
import React, {forwardRef, useCallback, useEffect, useRef} from 'react'
import styled, {keyframes} from 'styled-components'
import {Button} from '../../../../../../ui'
import {StatusButton} from '../../../../../components'
import {useTranslation} from '../../../../../i18n'
import {useSearchState} from '../contexts/search/useSearchState'
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
  ariaInputLabel: string
  onClose?: () => void
}

export const SearchHeader = forwardRef<HTMLInputElement, SearchHeaderProps>(function SearchHeader(
  {ariaInputLabel, onClose},
  ref,
) {
  const isMountedRef = useRef(false)

  const {
    dispatch,
    state: {
      filters,
      filtersVisible,
      fullscreen,
      result: {loading},
      terms: {types, query},
    },
  } = useSearchState()
  const {t} = useTranslation()

  const handleFiltersToggle = useCallback(
    () => dispatch({type: 'FILTERS_VISIBLE_SET', visible: !filtersVisible}),
    [dispatch, filtersVisible],
  )
  const handleQueryChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) =>
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
            tooltipProps={{content: t('search.action.close-search-aria-label')}}
          />
        )}

        {/* Search field */}
        <Box flex={1}>
          <CustomTextInput
            __unstable_disableFocusRing
            $background={fullscreen}
            $smallClearButton={fullscreen}
            aria-label={ariaInputLabel}
            autoFocus
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
