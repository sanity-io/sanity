import {SearchIcon, SpinnerIcon} from '@sanity/icons'
import {Box, Stack, TextInput} from '@sanity/ui'
import {memo, useCallback, useEffect, useMemo, useState} from 'react'
import {useObservableEvent} from 'react-rx'
import {debounce, map, type Observable, of, tap, timer} from 'rxjs'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  type GeneralPreviewLayoutKey,
  useActiveReleases,
  useClient,
  useI18nText,
  usePerspective,
  useReconnectingToast,
  useSchema,
  useTranslation,
  useUnique,
} from 'sanity'
import {keyframes, styled} from 'styled-components'

import {structureLocaleNamespace} from '../../i18n'
import {type BaseStructureToolPaneProps} from '../types'
import {EMPTY_RECORD, FULL_LIST_LIMIT} from './constants'
import {DocumentListPaneContent} from './DocumentListPaneContent'
import {
  DocumentListPaneSearchOrdering,
  getSearchOrderingId,
  isSortOrderingMenuItem,
  RELEVANCE_ORDERING_ID,
} from './DocumentListPaneSearchOrdering'
import {applyOrderingFunctions, findStaticTypesInFilter} from './helpers'
import {useShallowUnique} from './PaneContainer'
import {type LoadingVariant, type SortOrder} from './types'
import {useDocumentList} from './useDocumentList'

/**
 * @internal
 */
export type DocumentListPaneProps = BaseStructureToolPaneProps<'documentList'> & {
  sortOrder?: SortOrder
  layout?: GeneralPreviewLayoutKey
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
  // The ordering applied while a search term is present. Defaults to relevance
  // ranking, and resets back to relevance whenever the search is cleared.
  const [searchOrderingId, setSearchOrderingId] = useState<string>(RELEVANCE_ORDERING_ID)

  // The query the list actually searches on. Whitespace-only input is treated as
  // empty, so the search-scoped UI must key off the trimmed value too.
  const trimmedSearchQuery = searchQuery.trim()

  const sortWithOrderingFn =
    typeName && sortOrderRaw
      ? applyOrderingFunctions(sortOrderRaw, schema.get(typeName) as any)
      : sortOrderRaw

  const sortOrder = useUnique(sortWithOrderingFn)

  // The list's configured orderings, surfaced as choices in the search sort
  // control (relevance plus these).
  const searchOrderings = useMemo(
    () => (pane.menuItems || []).filter(isSortOrderingMenuItem),
    [pane.menuItems],
  )

  // While searching, relevance ranking is the default. If the editor picks one
  // of the configured orderings instead, apply that order and disable scoring.
  const useRelevance = searchOrderingId === RELEVANCE_ORDERING_ID
  const selectedSearchOrdering = useRelevance
    ? undefined
    : searchOrderings.find((ordering) => getSearchOrderingId(ordering) === searchOrderingId)
  const searchSchemaType = typeName ? schema.get(typeName) : undefined
  const effectiveSortOrder = useUnique(
    selectedSearchOrdering?.params?.by
      ? // Run the chosen ordering through `applyOrderingFunctions` so it picks up
        // the same field mappers (e.g. `lower`, `dateTime`) the header sort menu
        // uses — otherwise the same ordering would sort differently here.
        // `applyOrderingFunctions` requires a concrete schema type, so only apply
        // it when the type is statically resolvable; otherwise fall back to the
        // raw ordering rather than passing `undefined`.
        searchSchemaType
        ? applyOrderingFunctions({by: selectedSearchOrdering.params.by}, searchSchemaType as any)
        : {by: selectedSearchOrdering.params.by}
      : sortOrder,
  )

  const client = useClient({
    ...DEFAULT_STUDIO_CLIENT_OPTIONS,
    apiVersion: apiVersion || DEFAULT_STUDIO_CLIENT_OPTIONS.apiVersion,
  })

  const {
    error,
    isLoadingFullList,
    isLoading: documentListIsLoading,
    items,
    fromCache,
    isRetrying,
    autoRetry,
    canRetry,
    retryCount,
    connected,
    onLoadFullList,
    onRetry,
  } = useDocumentList({
    client,
    filter,
    perspective: perspectiveStack,
    params,
    searchQuery: trimmedSearchQuery,
    sortOrder: effectiveSortOrder,
    searchSortByRelevance: useRelevance,
  })

  const isLoading = documentListIsLoading || releases.loading

  const handleQueryChange = useObservableEvent(
    (event$: Observable<React.ChangeEvent<HTMLInputElement>>) => {
      return event$.pipe(
        map((event) => event.target.value),
        tap(setSearchInputValue),
        debounce((value) => (value === '' ? of('') : timer(300))),
        tap((value) => {
          setSearchQuery(value)
          if (!value.trim()) {
            setSearchOrderingId(RELEVANCE_ORDERING_ID)
          }
        }),
      )
    },
  )

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchInputValue('')
    setSearchOrderingId(RELEVANCE_ORDERING_ID)
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
      // oxlint-disable-next-line react/react-compiler
      setEnableSearchSpinner(paneKey)
    }
  }, [enableSearchSpinner, isLoading, paneKey])

  useEffect(() => {
    // Clear search field and disable search spinner
    // when switching between panes (i.e. when paneKey changes).
    // oxlint-disable-next-line react/react-compiler
    handleClearSearch()
    setEnableSearchSpinner()
  }, [paneKey, handleClearSearch])

  const loadingVariant: LoadingVariant = useMemo(() => {
    if (connected && isLoading && enableSearchSpinner === paneKey) {
      return 'spinner'
    }
    if (connected && fromCache) {
      return 'subtle'
    }

    return 'initial'
  }, [connected, enableSearchSpinner, fromCache, isLoading, paneKey])

  const textInputIcon = useMemo(() => {
    if (loadingVariant === 'spinner') {
      return AnimatedSpinnerIcon
    }
    if (searchInputValue && loadingVariant === 'subtle') {
      return SubtleSpinnerIcon
    }
    return SearchIcon
  }, [loadingVariant, searchInputValue])

  useReconnectingToast(!connected)

  return (
    <>
      <Box paddingX={3} paddingBottom={3}>
        <Stack space={3}>
          <TextInput
            aria-label={t('panes.document-list-pane.search-input.aria-label')}
            autoComplete="off"
            border={false}
            clearButton={Boolean(searchQuery)}
            fontSize={[2, 2, 1]}
            icon={textInputIcon}
            iconRight={
              !connected || (loadingVariant === 'subtle' && !searchInputValue)
                ? DelayedSubtleSpinnerIcon
                : null
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
          {trimmedSearchQuery && (
            <DocumentListPaneSearchOrdering
              orderings={searchOrderings}
              value={searchOrderingId}
              onChange={setSearchOrderingId}
            />
          )}
        </Stack>
      </Box>
      <DocumentListPaneContent
        key={paneKey}
        childItemId={childItemId}
        error={error}
        filterIsSimpleTypeConstraint={!!typeName}
        hasMaxItems={items.length === FULL_LIST_LIMIT}
        hasSearchQuery={Boolean(searchQuery)}
        isActive={isActive}
        isLazyLoading={isLoadingFullList}
        isLoading={isLoading}
        autoRetry={autoRetry}
        canRetry={canRetry}
        retryCount={retryCount}
        isRetrying={isRetrying}
        isConnected={connected}
        items={items}
        layout={layout}
        muted={loadingVariant === 'subtle'}
        loadingVariant={loadingVariant}
        onEndReached={onLoadFullList}
        onRetry={onRetry}
        paneTitle={title}
        searchInputElement={searchInputElement}
        showIcons={showIcons}
        sortOrder={sortOrder}
      />
    </>
  )
})
