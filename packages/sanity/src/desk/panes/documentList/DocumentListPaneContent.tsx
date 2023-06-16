import {SyncIcon} from '@sanity/icons'
import {Box, Button, Card, Container, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {SanityDocument} from '@sanity/types'
import styled from 'styled-components'
import {Delay, PaneContent, usePane, usePaneLayout, PaneItem} from '../../components'
import {DocumentListPaneItem, LoadingVariant} from './types'
import {FULL_LIST_LIMIT} from './constants'
import {
  CommandList,
  CommandListRenderItemCallback,
  GeneralPreviewLayoutKey,
  SanityDefaultPreview,
  getPublishedId,
  useSchema,
} from 'sanity'

const RootBox = styled(Box)`
  position: relative;
`

const CommandListBox = styled(Box)`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
`

interface DocumentListPaneContentProps {
  childItemId?: string
  error: {message: string} | null
  filterIsSimpleTypeConstraint: boolean
  hasMaxItems?: boolean
  hasSearchQuery: boolean
  isActive?: boolean
  isLazyLoading: boolean
  isLoading: boolean
  items: DocumentListPaneItem[]
  layout?: GeneralPreviewLayoutKey
  loadingVariant?: LoadingVariant
  onListChange: () => void
  onRetry?: (event: unknown) => void
  paneTitle: string
  searchInputElement: HTMLInputElement | null
  showIcons: boolean
}

const SKELETON_ITEMS = [...Array(30).keys()]

function LoadingView(props: {layout?: GeneralPreviewLayoutKey}) {
  const {layout} = props

  return (
    <Stack padding={2} space={1}>
      {SKELETON_ITEMS.map((num) => (
        <Card padding={2} key={num}>
          <SanityDefaultPreview isPlaceholder layout={layout} />
        </Card>
      ))}
    </Stack>
  )
}

export function DocumentListPaneContent(props: DocumentListPaneContentProps) {
  const {
    childItemId,
    error,
    filterIsSimpleTypeConstraint,
    hasMaxItems,
    hasSearchQuery,
    isActive,
    isLazyLoading,
    isLoading,
    items,
    layout,
    loadingVariant,
    onListChange,
    onRetry,
    paneTitle,
    searchInputElement,
    showIcons,
  } = props

  const schema = useSchema()

  const {collapsed: layoutCollapsed} = usePaneLayout()
  const {collapsed, index} = usePane()
  const [shouldRender, setShouldRender] = useState(false)

  const handleEndReached = useCallback(() => {
    if (isLoading || isLazyLoading || !shouldRender) return

    onListChange()
  }, [isLazyLoading, isLoading, onListChange, shouldRender])

  useEffect(() => {
    if (collapsed) return undefined

    const timer = setTimeout(() => {
      setShouldRender(true)
    }, 0)

    return () => {
      clearTimeout(timer)
    }
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
            icon={showIcons === false ? false : undefined}
            id={publishedId}
            layout={layout}
            marginBottom={1}
            pressed={pressed}
            schemaType={schema.get(item._type)}
            selected={selected}
            value={item}
          />

          {showSpinner && (
            <Flex align="center" justify="center" padding={4}>
              <Spinner muted />
            </Flex>
          )}

          {showMaxItemsMessage && (
            <Box marginY={1} paddingX={3} paddingY={4}>
              <Text align="center" muted size={1}>
                Displaying a maximum of {FULL_LIST_LIMIT} documents
              </Text>
            </Box>
          )}
        </>
      )
    },
    [childItemId, isActive, items.length, layout, schema, showIcons, hasMaxItems, isLazyLoading]
  )

  const noDocumentsContent = useMemo(() => {
    if (hasSearchQuery) {
      return (
        <Flex align="center" direction="column" height="fill" justify="center">
          <Container width={1}>
            <Box paddingX={4} paddingY={5}>
              <Text align="center" muted>
                No results found
              </Text>
            </Box>
          </Container>
        </Flex>
      )
    }

    return (
      <Flex align="center" direction="column" height="fill" justify="center">
        <Container width={1}>
          <Box paddingX={4} paddingY={5}>
            <Text align="center" muted>
              {filterIsSimpleTypeConstraint ? 'No documents of this type' : 'No matching documents'}
            </Text>
          </Box>
        </Container>
      </Flex>
    )
  }, [filterIsSimpleTypeConstraint, hasSearchQuery])

  const mainContent = useMemo(() => {
    if (!shouldRender) {
      return null
    }

    if (error) {
      return (
        <Flex align="center" direction="column" height="fill" justify="center">
          <Container width={1}>
            <Stack paddingX={4} paddingY={5} space={4}>
              <Heading as="h3">Could not fetch list items</Heading>
              <Text as="p">
                Error: <code>{error.message}</code>
              </Text>

              {onRetry && (
                <Box>
                  <Button icon={SyncIcon} onClick={onRetry} text="Retry" tone="primary" />
                </Box>
              )}
            </Stack>
          </Container>
        </Flex>
      )
    }

    if (!isLoading && items.length === 0) {
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
      <RootBox overflow="hidden" height="fill">
        <CommandListBox>
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel={paneTitle}
            canReceiveFocus
            focusRingOffset={-3}
            inputElement={searchInputElement}
            itemHeight={51}
            items={items}
            key={key}
            onEndReached={handleEndReached}
            onlyShowSelectionWhenActive
            overscan={10}
            padding={2}
            paddingBottom={1}
            renderItem={renderItem}
            wrapAround={false}
          />
        </CommandListBox>
      </RootBox>
    )
    // Explicitly don't include `noDocumentsContent` in the deps array, as it's
    // causing a visual bug where the "No documents" message is shown for a split second
    // when clearing a search query with no results
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    collapsed,
    error,
    handleEndReached,
    index,
    isLoading,
    items,
    layout,
    loadingVariant,
    // noDocumentsContent,
    onRetry,
    renderItem,
    searchInputElement,
    shouldRender,
  ])

  return (
    <PaneContent overflow={layoutCollapsed || loadingVariant === 'initial' ? 'hidden' : 'auto'}>
      {mainContent}
    </PaneContent>
  )
}
