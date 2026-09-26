import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {ControlsIcon} from '@sanity/icons/Controls'
import {SearchIcon} from '@sanity/icons/Search'
import {SpinnerIcon} from '@sanity/icons/Spinner'
import {Card} from '@sanity/ui'
import {type ChangeEvent, useCallback, type RefAttributes} from 'react'
import {keyframes, styled} from 'styled-components'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../../../ui-components/button/Button'
import {StatusButton} from '../../../../../components/StatusButton'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {selectHasSearchableTerms} from '../contexts/search/searchSelectors'
import {
  useSearchFiltersVisible,
  useSearchSelector,
  useSearchState,
} from '../contexts/search/useSearchState'
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
  height: round(1em, 2px);
  width: round(1em, 2px);
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
export function SearchHeader({
  ref,
  ariaInputLabel,
  onClose,
}: SearchHeaderProps & RefAttributes<HTMLInputElement>) {
  const {t} = useTranslation()
  const {fullscreen, searchActorRef} = useSearchState()
  const query = useSearchSelector((snapshot) => snapshot.context.terms.query)
  const loading = useSearchSelector((snapshot) => snapshot.context.result.loading)
  const hasValidTerms = useSearchSelector(selectHasSearchableTerms)
  const notificationBadgeVisible = useSearchSelector(
    (snapshot) => snapshot.context.filters.length > 0 || snapshot.context.terms.types.length > 0,
  )
  const filtersVisible = useSearchFiltersVisible()

  const ariaLabel =
    ariaInputLabel || hasValidTerms
      ? t('search.search-results-aria-label')
      : t('search.recent-searches-aria-label')

  const handleFiltersToggle = useCallback(
    () => searchActorRef.send({type: 'FILTERS_VISIBLE_SET', visible: !filtersVisible}),
    [searchActorRef, filtersVisible],
  )
  const handleQueryChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      searchActorRef.send({type: 'TERMS_QUERY_SET', query: e.currentTarget.value}),
    [searchActorRef],
  )
  const handleQueryClear = useCallback(() => {
    searchActorRef.send({type: 'TERMS_QUERY_SET', query: ''})
  }, [searchActorRef])

  return (
    <Card flex="none">
      <Flex
        alignItems="center"
        flexBasis="0%"
        flexGrow={1}
        gap={fullscreen ? 2 : 1}
        padding={fullscreen ? 2 : 1}
      >
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
        <Box flexBasis="0%" flexGrow={1}>
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
}
