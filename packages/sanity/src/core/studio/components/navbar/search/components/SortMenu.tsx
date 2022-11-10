import {SortIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Flex,
  Inline,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  Text,
} from '@sanity/ui'
import isEqual from 'lodash/isEqual'
import React, {useCallback, useId, useMemo} from 'react'
import styled from 'styled-components'
import {ORDERINGS} from '../definitions/orderings'
import {SUBHEADER_HEIGHT_SMALL} from '../constants'
import {useSearchState} from '../contexts/search/useSearchState'
import type {SearchOrdering} from '../types'

interface SortMenuProps {
  small?: boolean
}

interface SearchDivider {
  type: 'divider'
}

const MENU_ORDERINGS: (SearchDivider | SearchOrdering)[] = [
  ORDERINGS.relevance,
  {type: 'divider'},
  ORDERINGS.createdAsc,
  ORDERINGS.createdDesc,
  {type: 'divider'},
  ORDERINGS.updatedAsc,
  ORDERINGS.updatedDesc,
]

const SortMenuContentFlex = styled(Flex)<{$small?: boolean}>`
  box-sizing: border-box;
  height: ${SUBHEADER_HEIGHT_SMALL};
`

function isSearchDivider(item: SearchDivider | SearchOrdering): item is SearchDivider {
  return (item as SearchDivider).type === 'divider'
}

function CustomMenuItem({ordering}: {ordering: SearchOrdering}) {
  const {
    dispatch,
    state: {ordering: currentOrdering},
  } = useSearchState()

  const handleClick = useCallback(() => {
    dispatch({ordering, type: 'ORDERING_SET'})
  }, [dispatch, ordering])

  const isSelected = useMemo(() => isEqual(currentOrdering, ordering), [currentOrdering, ordering])

  return (
    <MenuItem
      onClick={handleClick}
      padding={3}
      pressed={isSelected}
      selected={isSelected}
      tone="default"
    >
      <Flex align="center" justify="space-between" paddingRight={2}>
        <Text size={1} weight="medium">
          {ordering.title}
        </Text>
      </Flex>
    </MenuItem>
  )
}

export function SortMenu({small}: SortMenuProps) {
  const {
    state: {ordering},
  } = useSearchState()

  const menuButtonId = useId()

  const currentMenuItem = MENU_ORDERINGS.find(
    (item): item is SearchOrdering => isEqual(ordering, item) && !isSearchDivider(item)
  )

  if (!currentMenuItem) {
    return null
  }

  return (
    <Card borderBottom>
      <SortMenuContentFlex
        $small={small}
        align="center"
        flex={1}
        marginLeft={small ? 0 : 1}
        padding={2}
      >
        <MenuButton
          button={
            <Button mode="bleed" padding={2}>
              <Flex align="center" gap={1} justify="space-between">
                <Box marginRight={1}>
                  <Text size={1}>
                    <SortIcon />
                  </Text>
                </Box>
                <Inline space={2}>
                  <Text size={1} weight="medium">
                    {currentMenuItem.title}
                  </Text>
                </Inline>
              </Flex>
            </Button>
          }
          id={menuButtonId || ''}
          menu={
            <Menu>
              {MENU_ORDERINGS.map((item, index) => {
                if (isSearchDivider(item)) {
                  // eslint-disable-next-line react/no-array-index-key
                  return <MenuDivider key={index} />
                }
                return (
                  <CustomMenuItem
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    ordering={item}
                  />
                )
              })}
            </Menu>
          }
          placement="bottom-start"
          popover={{portal: true, radius: 2}}
        />
      </SortMenuContentFlex>
    </Card>
  )
}
