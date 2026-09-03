import {type SanityDocument} from '@sanity/types'
import {Container, Heading, Stack, Text} from '@sanity/ui'
import {clsx} from 'clsx'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  CommandList,
  type CommandListRenderItemCallback,
  Delay,
  ErrorActions,
  type GeneralPreviewLayoutKey,
  getPublishedId,
  isDev,
  LoadingBlock,
  SanityDefaultPreview,
  Translate,
  useSchema,
  useTranslation,
} from 'sanity'
import {Flex, Box} from 'ui5'

import {PaneContent} from '../../components/pane/PaneContent'
import {usePane} from '../../components/pane/usePane'
import {usePaneLayout} from '../../components/pane/usePaneLayout'
import {PaneItem} from '../../components/paneItem/PaneItem'
import {structureLocaleNamespace} from '../../i18n'
import {FULL_LIST_LIMIT} from './constants'
import {commandListBox, rootBox, rootBoxMuted} from './DocumentListPaneContent.css'
import {type DocumentListPaneItem, type LoadingVariant, type SortOrder} from './types'

interface DocumentListPaneContentProps {
  childItemId?: string
  error: {message: string} | null
  filterIsSimpleTypeConstraint: boolean
  hasMaxItems?: boolean
  muted?: boolean
  hasSearchQuery: boolean
  isActive?: boolean
  isLazyLoading: boolean
  isLoading: boolean
  isConnected?: boolean
  autoRetry?: boolean
  canRetry: boolean
  retryCount?: number
  isRetrying?: boolean
  items: DocumentListPaneItem[]
  layout?: GeneralPreviewLayoutKey
  loadingVariant?: LoadingVariant
  onEndReached: () => void
  onRetry?: () => void
  paneTitle: string
  searchInputElement: HTMLInputElement | null
  showIcons: boolean
  sortOrder?: SortOrder
}

const SKELETON_ITEMS = [...Array(30).keys()]

function LoadingView(props: {layout?: GeneralPreviewLayoutKey}) {
  const {layout} = props

  return (
    <Stack paddingX={3} paddingY={2} paddingTop={0} gap={1}>
      {SKELETON_ITEMS.map((num) => (
        <SanityDefaultPreview key={num} isPlaceholder layout={layout} />
      ))}
    </Stack>
  )
}

export function DocumentListPaneContent(props: DocumentListPaneContentProps) {
  const {
    childItemId,
    error,
    isRetrying,
    autoRetry,
    filterIsSimpleTypeConstraint,
    hasMaxItems,
    hasSearchQuery,
    isActive,
    isLazyLoading,
    muted,
    isLoading,
    isConnected,
    retryCount,
    canRetry,
    items,
    layout,
    loadingVariant,
    onEndReached,
    onRetry,
    paneTitle,
    searchInputElement,
    showIcons,
    sortOrder,
  } = props

  const schema = useSchema()

  const {collapsed: layoutCollapsed} = usePaneLayout()
  const {collapsed, index} = usePane()
  const [shouldRender, setShouldRender] = useState(!collapsed)
  const {t} = useTranslation(structureLocaleNamespace)

  const handleEndReached = useCallback(() => {
    if (shouldRender) {
      onEndReached()
    }
  }, [onEndReached, shouldRender])

  useEffect(() => {
    if (collapsed) return undefined

    const timer = setTimeout(() => {
      setShouldRender(true)
    }, 0)

    return () => {
      clearTimeout(timer)
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
  }, [collapsed, items])

  const renderItem = useCallback<CommandListRenderItemCallback<SanityDocument>>(
    (item, {activeIndex}) => {
      const publishedId = getPublishedId(item._id)
      const isSelected = childItemId === publishedId
      const pressed = !isActive && isSelected
      const selected = isActive && isSelected
      const isLastItem = activeIndex === items.length - 1
      const showSpinner = isLastItem && isLazyLoading
      const showMaxItemsMessage = isLastItem && hasMaxItems

      return (
        <>
          <PaneItem
            icon={showIcons ? undefined : false}
            id={publishedId}
            layout={layout}
            marginBottom={1}
            pressed={pressed}
            schemaType={schema.get(item._type)}
            selected={selected}
            sortOrder={sortOrder}
            value={item}
          />

          {showSpinner && <LoadingBlock />}

          {showMaxItemsMessage && (
            <Box marginY={1} paddingX={3} paddingY={4}>
              <Text align="center" muted size={1}>
                {t('panes.document-list-pane.max-items.text', {limit: FULL_LIST_LIMIT})}
              </Text>
            </Box>
          )}
        </>
      )
    },
    [
      childItemId,
      isActive,
      items.length,
      layout,
      schema,
      showIcons,
      sortOrder,
      hasMaxItems,
      isLazyLoading,
      t,
    ],
  )

  const noDocumentsContent = useMemo(() => {
    if (hasSearchQuery) {
      return (
        <Flex alignItems="center" flexDirection="column" height="100%" justifyContent="center">
          <Container width={1}>
            <Box paddingX={4} paddingY={5}>
              <Text align="center" muted>
                {t('panes.document-list-pane.no-documents.text')}
              </Text>
            </Box>
          </Container>
        </Flex>
      )
    }

    return (
      <Flex alignItems="center" flexDirection="column" height="100%" justifyContent="center">
        <Container width={1}>
          <Box paddingX={4} paddingY={5}>
            <Text align="center" muted>
              {filterIsSimpleTypeConstraint
                ? t('panes.document-list-pane.no-documents-of-type.text')
                : t('panes.document-list-pane.no-matching-documents.text')}
            </Text>
          </Box>
        </Container>
      </Flex>
    )
  }, [filterIsSimpleTypeConstraint, hasSearchQuery, t])

  const mainContent = useMemo(() => {
    if (!shouldRender) {
      return null
    }

    const isOnline = window.navigator.onLine
    if (error) {
      return (
        <Flex alignItems="center" flexDirection="column" height="100%" justifyContent="center">
          <Container width={1}>
            <Stack paddingX={4} paddingY={5} gap={4}>
              <Heading as="h3">{t('panes.document-list-pane.error.title')}</Heading>
              <Text as="p">
                {isDev ? (
                  <Translate
                    t={t}
                    i18nKey="panes.document-list-pane.error.text.dev"
                    values={{error: error.message}}
                    components={{Code: 'code'}}
                  />
                ) : isOnline ? (
                  t('panes.document-list-pane.error.text')
                ) : (
                  t('panes.document-list-pane.error.text.offline')
                )}
              </Text>
              <ErrorActions
                error={error}
                eventId={null}
                onRetry={isOnline && canRetry ? onRetry : undefined}
                isRetrying={isRetrying}
              />
              {canRetry ? (
                <Text as="p" muted size={1}>
                  {isRetrying
                    ? t('panes.document-list-pane.error.retrying', {count: retryCount})
                    : autoRetry
                      ? t('panes.document-list-pane.error.will-retry-automatically', {
                          count: retryCount,
                        })
                      : t('panes.document-list-pane.error.max-retries-attempted', {
                          count: retryCount,
                        })}
                </Text>
              ) : null}
            </Stack>
          </Container>
        </Flex>
      )
    }

    if (isConnected && !isLoading && items.length === 0) {
      return noDocumentsContent
    }

    if (loadingVariant === 'initial' && isLoading) {
      return (
        <Delay ms={300}>
          <LoadingView layout={layout} />
        </Delay>
      )
    }

    if (loadingVariant === 'spinner' && isLoading) {
      return null
    }

    // prevents bug when panes won't render if first rendered while collapsed
    const key = `${index}-${collapsed}`

    return (
      <Box overflow="hidden" height="100%" className={clsx(rootBox, muted && rootBoxMuted)}>
        <Box className={commandListBox}>
          <CommandList
            key={key}
            activeItemDataAttr="data-hovered"
            ariaLabel={paneTitle}
            canReceiveFocus
            inputElement={searchInputElement}
            itemHeight={51}
            items={items}
            onEndReached={handleEndReached}
            onlyShowSelectionWhenActive
            overscan={10}
            paddingBottom={1}
            paddingX={3}
            renderItem={renderItem}
            wrapAround={false}
          />
        </Box>
      </Box>
    )
  }, [
    autoRetry,
    canRetry,
    collapsed,
    error,
    handleEndReached,
    index,
    isConnected,
    isLoading,
    isRetrying,
    items,
    layout,
    loadingVariant,
    muted,
    noDocumentsContent,
    onRetry,
    paneTitle,
    renderItem,
    retryCount,
    searchInputElement,
    shouldRender,
    t,
  ])

  return (
    <PaneContent
      data-testid="document-list-pane"
      overflow={layoutCollapsed || loadingVariant === 'initial' ? 'hidden' : 'auto'}
    >
      {mainContent}
    </PaneContent>
  )
}
