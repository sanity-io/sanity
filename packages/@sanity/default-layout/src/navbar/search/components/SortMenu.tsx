import {CheckmarkIcon, SelectIcon} from '@sanity/icons'
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
import {isEqual} from 'lodash'
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

// null items are represented as dividers
const MENU_ORDERINGS: (SearchOrdering | null)[] = [
  ORDER_RELEVANCE,
  null,
  ORDER_CREATED_DESC,
  ORDER_CREATED_ASC,
  null,
  ORDER_UPDATED_DESC,
  ORDER_UPDATED_ASC,
]

const IconWrapperBox = styled(Box)<{$visible: boolean}>`
  visibility: ${({$visible}) => ($visible ? 'visible' : 'hidden')};
`

const SortMenuContentFlex = styled(Flex)<{$small: boolean}>`
  box-sizing: border-box;
  height: ${({$small}) => ($small ? SUBHEADER_HEIGHT_SMALL : SUBHEADER_HEIGHT_LARGE)}px;
`

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
          <Text size={1} weight="semibold">
            {ordering.title}
          </Text>
          <Text size={1}>{ordering.subtitle}</Text>
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

  const currentMenuItem = MENU_ORDERINGS.find((item) => isEqual(ordering, item))

  return (
    <Card borderBottom>
      <SortMenuContentFlex $small={small} align="center" flex={1} padding={1}>
        <MenuButton
          button={
            <Button mode="bleed" padding={2}>
              <Flex align="center" gap={1} justify="space-between">
                <Inline space={1}>
                  <Text size={1} weight="semibold">
                    {currentMenuItem.title}
                  </Text>
                  {currentMenuItem?.subtitle && <Text size={1}>{currentMenuItem.subtitle}</Text>}
                </Inline>
                <SelectIcon />
              </Flex>
            </Button>
          }
          id="search-order"
          menu={
            <Menu>
              {MENU_ORDERINGS.map((item, index) => {
                if (item === null) {
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
          popover={{portal: true}}
        />
      </SortMenuContentFlex>
    </Card>
  )
}
