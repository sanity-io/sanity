import {SearchIcon, SpinnerIcon} from '@sanity/icons'
import {Box, TextInput} from '@sanity/ui'
import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useObservableCallback} from 'react-rx'
import {debounce, map, type Observable, of, tap, timer} from 'rxjs'
import {
  type GeneralPreviewLayoutKey,
  useI18nText,
  useSchema,
  useTranslation,
  useUnique,
} from 'sanity'
import {keyframes, styled} from 'styled-components'

import {structureLocaleNamespace} from '../../i18n'
import {type BaseStructureToolPaneProps} from '../types'
import {EMPTY_RECORD} from './constants'
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

const AnimatedSpinnerIcon = styled(SpinnerIcon)`
  animation: ${rotate} 500ms linear infinite;
`

/**
 * @internal
 */

export const DocumentListPane = memo(function DocumentListPane(props: DocumentListPaneProps) {
  const {childItemId, isActive, pane, paneKey, sortOrder: sortOrderRaw, layout} = props
  const schema = useSchema()

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

  // A ref to determine if we should show the loading spinner in the search input.
  // This is used to avoid showing the spinner on initial load of the document list.
  // We only wan't to show the spinner when the user interacts with the search input.
  const showSearchLoadingRef = useRef<boolean>(false)

  const sortWithOrderingFn =
    typeName && sortOrderRaw
      ? applyOrderingFunctions(sortOrderRaw, schema.get(typeName) as any)
      : sortOrderRaw

  const sortOrder = useUnique(sortWithOrderingFn)

  const {
    error,
    hasMaxItems,
    isLazyLoading,
    isLoading,
    isSearchReady,
    items,
    onListChange,
    onRetry,
  } = useDocumentList({
    apiVersion,
    filter,
    params,
    searchQuery: searchQuery?.trim(),
    sortOrder,
  })

  const handleQueryChange = useObservableCallback(
    (event$: Observable<React.ChangeEvent<HTMLInputElement>>) => {
      return event$.pipe(
        map((event) => event.target.value),
        tap(setSearchInputValue),
        debounce((value) => (value === '' ? of('') : timer(300))),
        tap(setSearchQuery),
      )
    },
    [],
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

  useEffect(() => {
    if (showSearchLoadingRef.current === false && !isLoading) {
      showSearchLoadingRef.current = true
    }

    return () => {
      showSearchLoadingRef.current = false
    }
  }, [isLoading])

  useEffect(() => {
    // Clear search field and reset showSearchLoadingRef ref
    // when switching between panes (i.e. when paneKey changes).
    handleClearSearch()
    showSearchLoadingRef.current = false
  }, [paneKey, handleClearSearch])

  const loadingVariant: LoadingVariant = useMemo(() => {
    const showSpinner = isLoading && items.length === 0 && showSearchLoadingRef.current

    if (showSpinner) return 'spinner'

    return 'initial'
  }, [isLoading, items.length])

  return (
    <>
      <Box paddingX={3} paddingBottom={3}>
        <TextInput
          aria-label={t('panes.document-list-pane.search-input.aria-label')}
          autoComplete="off"
          border={false}
          clearButton={Boolean(searchQuery)}
          disabled={!isSearchReady}
          fontSize={[2, 2, 1]}
          icon={loadingVariant === 'spinner' ? AnimatedSpinnerIcon : SearchIcon}
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
        hasMaxItems={hasMaxItems}
        hasSearchQuery={Boolean(searchQuery)}
        isActive={isActive}
        isLazyLoading={isLazyLoading}
        isLoading={isLoading}
        items={items}
        key={paneKey}
        layout={layout}
        loadingVariant={loadingVariant}
        onListChange={onListChange}
        onRetry={onRetry}
        paneTitle={title}
        searchInputElement={searchInputElement}
        showIcons={showIcons}
      />
    </>
  )
})
