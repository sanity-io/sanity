import {SearchIcon} from '@sanity/icons/Search'
import {SpinnerIcon} from '@sanity/icons/Spinner'
import {Stack, TextInput} from '@sanity/ui'
import {useActorRef, useSelector} from '@xstate/react'
import {Activity, memo, useCallback, useEffect, useMemo, useState} from 'react'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  EMPTY_ARRAY,
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
import {Box} from 'ui5'

import {usePane} from '../../components/pane/usePane'
import {structureLocaleNamespace} from '../../i18n'
import {type BaseStructureToolPaneProps} from '../types'
import {DEFAULT_ORDERING, EMPTY_RECORD, FULL_LIST_LIMIT} from './constants'
import {DocumentListPaneContent} from './DocumentListPaneContent'
import {
  DocumentListPaneSearchOrdering,
  getSearchOrderingId,
  isSortOrderingMenuItem,
  RELEVANCE_ORDERING_ID,
} from './DocumentListPaneSearchOrdering'
import {documentListSearchMachine} from './documentListSearchMachine'
import {applyOrderingFunctions, findStaticTypesInFilter} from './helpers'
import {isOrderByIdsParam, reorderItemsByIdsParam} from './orderByIdsParam'
import {type LoadingVariant, type SortOrder} from './types'
import {useDocumentList} from './useDocumentList'
import {useShallowUnique} from './useShallowUnique'

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
  const {perspectiveStack, selectedVariantName} = usePerspective()
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
  // A collapsed pane is only wide enough for the rotated header. Keep the pane
  // body mounted so its state survives a collapse, but hide it to prevent its
  // contents from bleeding into the neighbouring pane.
  const {collapsed} = usePane()

  // All search-box state (input echo, debounced query, search ordering,
  // spinner arming) lives in one machine so pane changes and clears reset it
  // atomically. `useSelector` reads are synchronous, so the controlled input
  // echoes keystrokes without concurrent lag.
  const searchActorRef = useActorRef(documentListSearchMachine, {input: {paneKey}})
  const searchInputValue = useSelector(searchActorRef, (state) => state.context.inputValue)
  const searchQuery = useSelector(searchActorRef, (state) => state.context.searchQuery)
  const searchOrderingId = useSelector(searchActorRef, (state) => state.context.orderingId)
  const searchSpinnerEnabled = useSelector(searchActorRef, (state) => state.context.spinnerEnabled)
  const [searchInputElement, setSearchInputElement] = useState<HTMLInputElement | null>(null)

  // The query the list actually searches on. Whitespace-only input is treated as
  // empty, so the search-scoped UI must key off the trimmed value too.
  const trimmedSearchQuery = searchQuery.trim()

  const orderByIdsParam = isOrderByIdsParam(sortOrderRaw)

  const sortWithOrderingFn =
    typeName && sortOrderRaw
      ? applyOrderingFunctions(sortOrderRaw, schema.get(typeName) as any)
      : sortOrderRaw

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const sortOrder = useUnique(sortWithOrderingFn)

  // The sentinel ordering has no server-side meaning, so the fetch falls back to
  // the default ordering and the items are reordered client-side afterwards.
  const fetchSortOrder = orderByIdsParam ? DEFAULT_ORDERING : sortOrder

  // The list's configured orderings, surfaced as choices in the search sort
  // control (relevance plus these). The sentinel ordering is excluded; it isn't
  // a real sort choice the editor can apply while searching.
  const searchOrderings = useMemo(
    () =>
      (pane.menuItems || []).filter(
        (item) => isSortOrderingMenuItem(item) && !isOrderByIdsParam({by: item.params!.by}),
      ),
    [pane.menuItems],
  )

  // While searching, relevance ranking is the default. If the editor picks one
  // of the configured orderings instead, apply that order and disable scoring.
  const useRelevance = searchOrderingId === RELEVANCE_ORDERING_ID
  const selectedSearchOrdering = useRelevance
    ? undefined
    : searchOrderings.find((ordering) => getSearchOrderingId(ordering) === searchOrderingId)
  const searchSchemaType = typeName ? schema.get(typeName) : undefined
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
      : fetchSortOrder,
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
    variant: selectedVariantName,
    params,
    searchQuery: trimmedSearchQuery,
    sortOrder: effectiveSortOrder,
    searchSortByRelevance: useRelevance,
  })

  const orderedItems = useMemo(() => {
    if (!orderByIdsParam || trimmedSearchQuery) return items
    const idsParam = Array.isArray(params.ids) ? (params.ids as string[]) : EMPTY_ARRAY
    return reorderItemsByIdsParam(items, idsParam)
  }, [orderByIdsParam, trimmedSearchQuery, items, params.ids])

  const isLoading = documentListIsLoading || releases.loading

  const handleQueryChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      searchActorRef.send({type: 'input changed', value: event.currentTarget.value})
    },
    [searchActorRef],
  )

  const handleClearSearch = useCallback(() => {
    searchActorRef.send({type: 'input changed', value: ''})
  }, [searchActorRef])

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        handleClearSearch()
      }
    },
    [handleClearSearch],
  )

  const handleOrderingChange = useCallback(
    (orderingId: string) => {
      searchActorRef.send({type: 'ordering selected', orderingId})
    },
    [searchActorRef],
  )

  // One sensor forwards both external facts, so a pane change disarms the
  // spinner and an already-settled list (e.g. served from cache without an
  // `isLoading` cycle) re-arms it in the same pass. Re-sends are no-ops: the
  // machine swallows `pane changed` for the current pane, and `list settled`
  // assigns idempotently.
  useEffect(() => {
    searchActorRef.send({type: 'pane changed', paneKey})
    if (!isLoading) {
      searchActorRef.send({type: 'list settled'})
    }
  }, [isLoading, paneKey, searchActorRef])

  const loadingVariant: LoadingVariant = useMemo(() => {
    if (connected && isLoading && searchSpinnerEnabled) {
      return 'spinner'
    }
    if (connected && fromCache) {
      return 'subtle'
    }

    return 'initial'
  }, [connected, fromCache, isLoading, searchSpinnerEnabled])

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
    <Activity mode={collapsed ? 'hidden' : 'visible'}>
      <Box data-testid="document-list-search" paddingX={3} paddingBottom={3}>
        <Stack gap={3}>
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
              onChange={handleOrderingChange}
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
        items={orderedItems}
        layout={layout}
        muted={loadingVariant === 'subtle'}
        loadingVariant={loadingVariant}
        onEndReached={onLoadFullList}
        onRetry={onRetry}
        paneTitle={title}
        searchInputElement={searchInputElement}
        showIcons={showIcons}
        sortOrder={orderByIdsParam ? DEFAULT_ORDERING : sortOrder}
      />
    </Activity>
  )
})
