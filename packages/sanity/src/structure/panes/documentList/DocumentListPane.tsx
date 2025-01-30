import {SearchIcon, SpinnerIcon} from '@sanity/icons'
import {Box, TextInput} from '@sanity/ui'
import {memo, useCallback, useEffect, useMemo, useState} from 'react'
import {useObservableEvent} from 'react-rx'
import {debounce, map, type Observable, of, tap, timer} from 'rxjs'
import {
  type GeneralPreviewLayoutKey,
  useActiveReleases,
  useI18nText,
  usePerspective,
  useSchema,
  useTranslation,
  useUnique,
} from 'sanity'
import {keyframes, styled} from 'styled-components'

import {structureLocaleNamespace} from '../../i18n'
import {type BaseStructureToolPaneProps} from '../types'
import {EMPTY_RECORD, FULL_LIST_LIMIT} from './constants'
import {DocumentListPaneContent} from './DocumentListPaneContent'
import {applyOrderingFunctions, findStaticTypesInFilter} from './helpers'
import {useShallowUnique} from './PaneContainer'
import {type LoadingVariant, type SortOrder} from './types'
import {useDocumentList} from './useDocumentList'

/**
 * @internal
 */
export type DocumentListPaneProps = BaseStructureToolPaneProps<'documentList'> & {
  sortOrder?: SortOrder
  layout?: Exclude<GeneralPreviewLayoutKey, 'sheetList'>
}

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0.1;
  }
  100% {
    opacity: 0.4;
  }
`

const AnimatedSpinnerIcon = styled(SpinnerIcon)`
  animation: ${rotate} 500ms linear infinite;
`

const SubtleSpinnerIcon = styled(SpinnerIcon)`
  animation: ${rotate} 1500ms linear infinite;
  opacity: 0.4;
`

const DelayedSubtleSpinnerIcon = styled(SpinnerIcon)`
  animation:
    ${rotate} 1500ms linear infinite,
    ${fadeIn} 1000ms linear;
  opacity: 0.4;
`

/**
 * @internal
 */

export const DocumentListPane = memo(function DocumentListPane(props: DocumentListPaneProps) {
  const {childItemId, isActive, pane, paneKey, sortOrder: sortOrderRaw, layout} = props
  const schema = useSchema()
  const releases = useActiveReleases()
  const {perspectiveStack} = usePerspective()
  const {displayOptions, options} = pane
  const {apiVersion, filter} = options
  const params = useShallowUnique(options.params || EMPTY_RECORD)
  const typeName = useMemo(() => {
    const staticTypes = findStaticTypesInFilter(filter, params)
    if (staticTypes?.length === 1) return staticTypes[0]
    return null
  }, [filter, params])

  const showIcons = displayOptions?.showIcons !== false

  const {t} = useTranslation(structureLocaleNamespace)
  const {title} = useI18nText(pane)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchInputValue, setSearchInputValue] = useState<string>('')
  const [searchInputElement, setSearchInputElement] = useState<HTMLInputElement | null>(null)

  const sortWithOrderingFn =
    typeName && sortOrderRaw
      ? applyOrderingFunctions(sortOrderRaw, schema.get(typeName) as any)
      : sortOrderRaw

  const sortOrder = useUnique(sortWithOrderingFn)

  const {
    error,
    isLoadingFullList,
    isLoading: documentListIsLoading,
    items,
    fromCache,
    onLoadFullList,
    onRetry,
  } = useDocumentList({
    apiVersion,
    filter,
    perspective: perspectiveStack,
    params,
    searchQuery: searchQuery?.trim(),
    sortOrder,
  })

  const isLoading = documentListIsLoading || releases.loading

  const handleQueryChange = useObservableEvent(
    (event$: Observable<React.ChangeEvent<HTMLInputElement>>) => {
      return event$.pipe(
        map((event) => event.target.value),
        tap(setSearchInputValue),
        debounce((value) => (value === '' ? of('') : timer(300))),
        tap(setSearchQuery),
      )
    },
  )

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchInputValue('')
  }, [])

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        handleClearSearch()
      }
    },
    [handleClearSearch],
  )

  const [enableSearchSpinner, setEnableSearchSpinner] = useState<string | void>()

  useEffect(() => {
    if (!enableSearchSpinner && !isLoading) {
      setEnableSearchSpinner(paneKey)
    }
  }, [enableSearchSpinner, isLoading, paneKey])

  useEffect(() => {
    // Clear search field and disable search spinner
    // when switching between panes (i.e. when paneKey changes).
    handleClearSearch()
    setEnableSearchSpinner()
  }, [paneKey, handleClearSearch])

  const loadingVariant: LoadingVariant = useMemo(() => {
    if (isLoading && enableSearchSpinner === paneKey) {
      return 'spinner'
    }
    if (fromCache) {
      return 'subtle'
    }

    return 'initial'
  }, [enableSearchSpinner, fromCache, isLoading, paneKey])

  const textInputIcon = useMemo(() => {
    if (loadingVariant === 'spinner') {
      return AnimatedSpinnerIcon
    }
    if (searchInputValue && loadingVariant === 'subtle') {
      return SubtleSpinnerIcon
    }
    return SearchIcon
  }, [loadingVariant, searchInputValue])

  return (
    <>
      <Box paddingX={3} paddingBottom={3}>
        <TextInput
          aria-label={t('panes.document-list-pane.search-input.aria-label')}
          autoComplete="off"
          border={false}
          clearButton={Boolean(searchQuery)}
          disabled={Boolean(error)}
          fontSize={[2, 2, 1]}
          icon={textInputIcon}
          iconRight={
            loadingVariant === 'subtle' && !searchInputValue ? DelayedSubtleSpinnerIcon : null
          }
          onChange={handleQueryChange}
          onClear={handleClearSearch}
          onKeyDown={handleSearchKeyDown}
          padding={2}
          placeholder={t('panes.document-list-pane.search-input.placeholder')}
          radius={2}
          ref={setSearchInputElement}
          spellCheck={false}
          value={searchInputValue}
        />
      </Box>
      <DocumentListPaneContent
        childItemId={childItemId}
        error={error}
        filterIsSimpleTypeConstraint={!!typeName}
        hasMaxItems={items.length === FULL_LIST_LIMIT}
        hasSearchQuery={Boolean(searchQuery)}
        isActive={isActive}
        isLazyLoading={isLoadingFullList}
        isLoading={isLoading}
        items={items}
        key={paneKey}
        layout={layout}
        loadingVariant={loadingVariant}
        onEndReached={onLoadFullList}
        onRetry={onRetry}
        paneTitle={title}
        searchInputElement={searchInputElement}
        showIcons={showIcons}
      />
    </>
  )
})
