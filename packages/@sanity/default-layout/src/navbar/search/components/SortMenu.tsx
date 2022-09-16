import {useId} from '@reach/auto-id'
import {CheckmarkIcon, SortIcon} from '@sanity/icons'
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
import React, {useCallback, useMemo} from 'react'
import styled from 'styled-components'
import {SUBHEADER_HEIGHT_LARGE, SUBHEADER_HEIGHT_SMALL} from '../constants'
import {useSearchState} from '../contexts/search'
import {
  SearchOrdering,
  ORDER_CREATED_ASC,
  ORDER_CREATED_DESC,
  ORDER_RELEVANCE,
  ORDER_UPDATED_ASC,
  ORDER_UPDATED_DESC,
} from '../types'

interface SortMenuProps {
  small?: boolean
}

interface SearchDivider {
  type: 'divider'
}

const MENU_ORDERINGS: (SearchDivider | SearchOrdering)[] = [
  ORDER_RELEVANCE,
  {type: 'divider'},
  ORDER_CREATED_ASC,
  ORDER_CREATED_DESC,
  {type: 'divider'},
  ORDER_UPDATED_ASC,
  ORDER_UPDATED_DESC,
]

const IconWrapperBox = styled(Box)<{$visible: boolean}>`
  visibility: ${({$visible}) => ($visible ? 'visible' : 'hidden')};
`

const SortMenuContentFlex = styled(Flex)<{$small?: boolean}>`
  box-sizing: border-box;
  height: ${({$small}) => ($small ? SUBHEADER_HEIGHT_SMALL : SUBHEADER_HEIGHT_LARGE)}px;
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
    dispatch({ordering, type: 'SEARCH_ORDERING_SET'})
  }, [dispatch, ordering])

  const isSelected = useMemo(() => isEqual(currentOrdering, ordering), [currentOrdering, ordering])

  return (
    <MenuItem onClick={handleClick} padding={3} selected={isSelected} tone="default">
      <Flex align="center" justify="space-between" gap={4}>
        <Inline space={1}>
          <Text size={1} weight="medium">
            {ordering.title}
          </Text>
        </Inline>
        <IconWrapperBox $visible={isSelected}>
          <Text size={1}>
            <CheckmarkIcon />
          </Text>
        </IconWrapperBox>
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
        padding={1}
      >
        <MenuButton
          button={
            <Button mode="bleed" padding={3}>
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
