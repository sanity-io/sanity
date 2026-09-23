import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {ControlsIcon} from '@sanity/icons/Controls'
import {SearchIcon} from '@sanity/icons/Search'
import {SpinnerIcon} from '@sanity/icons/Spinner'
import {Card} from '@sanity/ui'
import {clsx} from 'clsx'
import {
  type ChangeEvent,
  type ComponentProps,
  useCallback,
  useEffect,
  useRef,
  type RefAttributes,
} from 'react'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../../../ui-components/button/Button'
import {StatusButton} from '../../../../../components/StatusButton'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {useSearchState} from '../contexts/search/useSearchState'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {CustomTextInput} from './common/CustomTextInput'
import {animatedSpinnerIcon, filterDiv} from './SearchHeader.css'

function AnimatedSpinnerIcon(props: ComponentProps<typeof SpinnerIcon>) {
  const {className, ...rest} = props
  return <SpinnerIcon {...rest} className={clsx(animatedSpinnerIcon, className)} />
}

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
    (e: ChangeEvent<HTMLInputElement>) =>
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
          <div className={filterDiv}>
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
          </div>
        )}
      </Flex>
    </Card>
  )
}
