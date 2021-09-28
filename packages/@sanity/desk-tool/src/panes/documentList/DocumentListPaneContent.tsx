// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {SyncIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
  VirtualList,
  VirtualListChangeOpts,
} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Delay} from '../../components/Delay'
import {PaneContent, usePane, usePaneLayout} from '../../components/pane'
import {PaneItem} from '../../components/paneItem'
import {DocumentListPaneItem, Layout} from './types'
import {getDocumentKey} from './helpers'
import {FULL_LIST_LIMIT} from './constants'

interface DocumentListPaneContentProps {
  childItemId: string
  error: {message: string} | null
  filterIsSimpleTypeContraint: boolean
  fullList: boolean
  isActive: boolean
  isLoading: boolean
  items: DocumentListPaneItem[] | null
  layout?: Layout
  onListChange: (opts: VirtualListChangeOpts) => void
  onRetry?: (event: unknown) => void
  showIcons: boolean
}

export function DocumentListPaneContent(props: DocumentListPaneContentProps) {
  const {
    childItemId,
    error,
    filterIsSimpleTypeContraint,
    fullList,
    isActive,
    isLoading,
    items,
    layout,
    onListChange,
    onRetry,
    showIcons,
  } = props

  const {collapsed: layoutCollapsed} = usePaneLayout()
  const {collapsed} = usePane()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (collapsed) return undefined

    const timer = setTimeout(() => {
      setShouldRender(true)
    }, 0)

    return () => {
      clearTimeout(timer)
    }
  }, [collapsed])

  const renderItem = useCallback(
    (item) => {
      const isSelected = childItemId === getPublishedId(item._id)
      const pressed = !isActive && isSelected
      const selected = isActive && isSelected

      return (
        <PaneItem
          icon={showIcons === false ? false : undefined}
          id={getPublishedId(item._id)}
          pressed={pressed}
          selected={selected}
          layout={layout}
          schemaType={schema.get(item._type)}
          value={item}
        />
      )
    },
    [childItemId, isActive, layout, showIcons]
  )

  const content = useMemo(() => {
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
                  {/* eslint-disable-next-line react/jsx-handler-names */}
                  <Button icon={SyncIcon} onClick={onRetry} text="Retry" tone="primary" />
                </Box>
              )}
            </Stack>
          </Container>
        </Flex>
      )
    }

    if (items === null) {
      return (
        <Flex align="center" direction="column" height="fill" justify="center">
          <Delay ms={300}>
            <>
              <Spinner muted />
              <Box marginTop={3}>
                <Text align="center" muted size={1}>
                  Loading documents…
                </Text>
              </Box>
            </>
          </Delay>
        </Flex>
      )
    }

    if (!isLoading && items.length === 0) {
      return (
        <Flex align="center" direction="column" height="fill" justify="center">
          <Container width={1}>
            <Box paddingX={4} paddingY={5}>
              <Text align="center" muted size={2}>
                {filterIsSimpleTypeContraint
                  ? 'No documents of this type'
                  : 'No matching documents'}
              </Text>
            </Box>
          </Container>
        </Flex>
      )
    }

    const hasMoreItems = fullList && items.length === FULL_LIST_LIMIT

    return (
      <Box padding={2}>
        {items.length > 0 && (
          <VirtualList
            gap={1}
            getItemKey={getDocumentKey}
            items={items}
            renderItem={renderItem}
            onChange={onListChange}
          />
        )}

        {isLoading && (
          <Card borderTop marginTop={1} paddingX={3} paddingY={4}>
            <Text align="center" muted size={1}>
              Loading…
            </Text>
          </Card>
        )}

        {hasMoreItems && (
          <Card marginTop={1} paddingX={3} paddingY={4} radius={2} tone="transparent">
            <Text align="center" muted size={1}>
              Displaying a maximum of {FULL_LIST_LIMIT} documents
            </Text>
          </Card>
        )}
      </Box>
    )
  }, [
    error,
    filterIsSimpleTypeContraint,
    fullList,
    onListChange,
    isLoading,
    items,
    onRetry,
    renderItem,
    shouldRender,
  ])

  return <PaneContent overflow={layoutCollapsed ? undefined : 'auto'}>{content}</PaneContent>
}
