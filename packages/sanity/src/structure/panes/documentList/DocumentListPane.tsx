import {SearchIcon, SpinnerIcon} from '@sanity/icons'
import {Box, Stack, TextInput} from '@sanity/ui'
import {memo, useCallback, useEffect, useMemo, useState} from 'react'
import {useObservableEvent} from 'react-rx'
import {debounce, map, type Observable, of, tap, timer} from 'rxjs'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  EMPTY_ARRAY,
  type GeneralPreviewLayoutKey,
  getAnyPendingProposal,
  getPublishedId,
  type ObjectSchemaType,
  useActiveReleases,
  useClient,
  useConfidenceStoreVersion,
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
import {DEFAULT_ORDERING, EMPTY_RECORD, FULL_LIST_LIMIT} from './constants'
import {DocumentListPaneContent} from './DocumentListPaneContent'
import {DocumentListPaneControls, type ListStatusFilter} from './DocumentListPaneControls'
import {
  DocumentListPaneSearchOrdering,
  getSearchOrderingId,
  isSortOrderingMenuItem,
  RELEVANCE_ORDERING_ID,
} from './DocumentListPaneSearchOrdering'
import {applyOrderingFunctions, findStaticTypesInFilter} from './helpers'
import {buildFieldFacets, type FacetValuesById, getFacetCandidateFields} from './listFacets'
import {isOrderByIdsParam, reorderItemsByIdsParam} from './orderByIdsParam'
import {useShallowUnique} from './PaneContainer'
import {
  DocumentListBulkActionBar,
  DocumentListSelectionProvider,
  PaneItemContextMenu,
} from './selection'
import {type LoadingVariant, type SortOrder} from './types'
import {useDocumentList} from './useDocumentList'

/**
 * @internal
 */
export type DocumentListPaneProps = BaseStructureToolPaneProps<'documentList'> & {
  sortOrder?: SortOrder
  onSetSortOrder?: (sortOrder: SortOrder) => void
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
  const {
    childItemId,
    isActive,
    pane,
    paneKey,
    sortOrder: sortOrderRaw,
    onSetSortOrder,
    layout,
  } = props
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

  const orderByIdsParam = isOrderByIdsParam(sortOrderRaw)

  const sortWithOrderingFn =
    typeName && sortOrderRaw
      ? applyOrderingFunctions(sortOrderRaw, schema.get(typeName) as any)
      : sortOrderRaw

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

  // Structured per-pane filter (status facet + type facet). Applied
  // client-side over the loaded set for the prototype; the production path
  // is injecting these constraints into the list query itself.
  const [statusFilter, setStatusFilter] = useState<ListStatusFilter>('any')
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  // Schema-driven facet selections: field name -> selected values (OR within
  // a field, AND across fields).
  const [fieldFilters, setFieldFilters] = useState<Record<string, Array<string | boolean>>>({})
  // Confidence prototype: filter by the pending agent proposal's risk tier.
  const [tierFilter, setTierFilter] = useState<string[]>([])

  useEffect(() => {
    // Filters are pane-scoped: reset when switching panes.
    // oxlint-disable-next-line react/react-compiler
    setStatusFilter('any')
    setTypeFilter([])
    setFieldFilters({})
    setTierFilter([])
  }, [paneKey])

  // Mock risk tier per document (from its pending agent proposal, if any).
  // The store version invalidates the memo when proposals resolve.
  const confidenceVersion = useConfidenceStoreVersion()
  const docTiers = useMemo(() => {
    const map: Record<string, string> = {}
    for (const item of orderedItems) {
      const publishedId = getPublishedId(item._id)
      const proposal = getAnyPendingProposal(publishedId, item._type)
      if (proposal) map[publishedId] = proposal.tier
    }
    return map
    // oxlint-disable-next-line react/react-compiler, react-hooks/exhaustive-deps -- confidenceVersion intentionally invalidates
  }, [orderedItems, confidenceVersion])
  const availableTiers = useMemo(
    () => Array.from(new Set(Object.values(docTiers))).sort(),
    [docTiers],
  )

  const availableTypes = useMemo(
    () => Array.from(new Set(orderedItems.map((item) => item._type))).sort(),
    [orderedItems],
  )

  // Tier-2 filtering: the pane's schema type declares (or its data implies)
  // the facets. Only available when the list resolves to a single type.
  const paneSchemaType = typeName
    ? (schema.get(typeName) as ObjectSchemaType | undefined)
    : undefined
  const facetCandidates = useMemo(() => getFacetCandidateFields(paneSchemaType), [paneSchemaType])

  // The list query projects identifiers only, so facet values come from a
  // separate lightweight fetch. Prototype: client-side matching over these;
  // the production path injects the constraints into the list query itself.
  const [facetValues, setFacetValues] = useState<FacetValuesById>({})
  const facetFieldNames = useMemo(
    () => facetCandidates.map((candidate) => candidate.name),
    [facetCandidates],
  )
  useEffect(() => {
    if (!typeName || facetFieldNames.length === 0) {
      // oxlint-disable-next-line react/react-compiler
      setFacetValues({})
      return undefined
    }
    const subscription = client.observable
      .fetch(
        `*[_type == $type]{_id, ${facetFieldNames.join(', ')}}`,
        {type: typeName},
        {perspective: perspectiveStack, tag: 'structure.list-facets'},
      )
      .subscribe({
        next: (rows: Array<Record<string, unknown>>) => {
          const next: FacetValuesById = {}
          for (const row of rows) {
            const {_id, ...fields} = row
            const values: Record<string, string | boolean> = {}
            for (const [key, value] of Object.entries(fields)) {
              if (typeof value === 'string' || typeof value === 'boolean') values[key] = value
            }
            next[getPublishedId(String(_id))] = values
          }
          setFacetValues(next)
        },
        // facets degrade gracefully when the values fetch fails
        error: () => setFacetValues({}),
      })
    return () => subscription.unsubscribe()
    // items.length (not identity) so edits refresh without a fetch storm
  }, [client, typeName, facetFieldNames, perspectiveStack, orderedItems.length])

  const fieldFacets = useMemo(
    () => buildFieldFacets(facetCandidates, facetValues),
    [facetCandidates, facetValues],
  )

  const activeFieldFilters = useMemo(
    () => Object.entries(fieldFilters).filter(([, values]) => values.length > 0),
    [fieldFilters],
  )

  const filteredItems = useMemo(() => {
    if (
      statusFilter === 'any' &&
      typeFilter.length === 0 &&
      activeFieldFilters.length === 0 &&
      tierFilter.length === 0
    ) {
      return orderedItems
    }
    return orderedItems.filter((item) => {
      // Perspective queries normalize `_id` to the published form; the
      // version actually loaded (e.g. the draft) is in `_originalId`.
      const versionId = (item as {_originalId?: string})._originalId ?? item._id
      const hasDraft = versionId.startsWith('drafts.')
      if (statusFilter === 'edited' && !hasDraft) return false
      if (statusFilter === 'published' && hasDraft) return false
      if (tierFilter.length > 0 && !tierFilter.includes(docTiers[getPublishedId(item._id)] ?? ''))
        return false
      if (typeFilter.length > 0 && !typeFilter.includes(item._type)) return false
      const itemValues = facetValues[getPublishedId(item._id)]
      for (const [fieldName, values] of activeFieldFilters) {
        const value = itemValues?.[fieldName]
        if (value === undefined || !values.includes(value)) return false
      }
      return true
    })
  }, [
    orderedItems,
    statusFilter,
    typeFilter,
    activeFieldFilters,
    facetValues,
    tierFilter,
    docTiers,
  ])

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

  useEffect(() => {
    // Relevance ranking is search-scoped: whenever the term is cleared (via the
    // clear button, Escape, emptying the field, or switching panes), reset the
    // applied ordering back to relevance.
    if (!trimmedSearchQuery) {
      // TODO: Refactor search ordering reset to avoid effect state updates.
      // oxlint-disable-next-line react/react-compiler
      setSearchOrderingId(RELEVANCE_ORDERING_ID)
    }
  }, [trimmedSearchQuery])

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
    <DocumentListSelectionProvider items={filteredItems} paneKey={paneKey}>
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
          <DocumentListPaneControls
            availableTiers={availableTiers}
            availableTypes={availableTypes}
            fieldFacets={fieldFacets}
            fieldFilters={fieldFilters}
            onFieldFiltersChange={setFieldFilters}
            onTierFilterChange={setTierFilter}
            tierFilter={tierFilter}
            onSetSortOrder={onSetSortOrder}
            onStatusFilterChange={setStatusFilter}
            onTypeFilterChange={setTypeFilter}
            orderings={searchOrderings}
            showSort={!trimmedSearchQuery}
            sortOrder={sortOrderRaw}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
          />
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
        items={filteredItems}
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
      <PaneItemContextMenu />
      <DocumentListBulkActionBar />
    </DocumentListSelectionProvider>
  )
})
