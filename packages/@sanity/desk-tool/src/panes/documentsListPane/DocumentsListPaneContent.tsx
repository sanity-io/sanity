// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {SyncIcon} from '@sanity/icons'
import {
  Box,
  Button,
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
import {DocumentsListPaneItem, Layout} from './types'
import {getDocumentKey} from './helpers'
import {FULL_LIST_LIMIT} from './constants'

interface DocumentsListPaneContentProps {
  childItemId: string
  error: {message: string} | null
  filterIsSimpleTypeContraint: boolean
  fullList: boolean
  isActive: boolean
  isLoading: boolean
  items: DocumentsListPaneItem[] | null
  layout?: Layout
  onListChange: (opts: VirtualListChangeOpts) => void
  onRetry?: (event: unknown) => void
  showIcons: boolean
}

export function DocumentsListPaneContent(props: DocumentsListPaneContentProps) {
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
    (item) => (
      <PaneItem
        id={getPublishedId(item._id)}
        layout={layout}
        value={item}
        icon={showIcons === false ? false : undefined}
        schemaType={schema.get(item._type)}
        isSelected={childItemId === getPublishedId(item._id)}
        isActive={isActive}
      />
    ),
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

    if (isLoading || items === null) {
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

        {(isLoading || hasMoreItems) && (
          <Box marginTop={1} padding={4}>
            <Text align="center" muted>
              {isLoading && <>Loading…</>}
              {!isLoading && <>The list has more documents</>}
            </Text>
          </Box>
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
