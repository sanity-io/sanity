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
import {SearchSort} from '../types'

interface SortMenuItem {
  sort: SearchSort
  subtitle?: string
  title: string
  type: 'menuItem'
}

interface SortMenuItemDivider {
  type: 'divider'
}

interface SortMenuProps {
  small?: boolean
}

const MENU_ITEMS: (SortMenuItemDivider | SortMenuItem)[] = [
  {
    sort: {mode: 'relevance', order: 'asc'},
    title: 'Relevance',
    type: 'menuItem',
  },
  {
    type: 'divider',
  },
  {
    sort: {mode: 'createdAt', order: 'asc'},
    subtitle: 'Newest first',
    title: 'Created at',
    type: 'menuItem',
  },
  {
    sort: {mode: 'createdAt', order: 'desc'},
    subtitle: 'Oldest first',
    title: 'Created at',
    type: 'menuItem',
  },
  {
    type: 'divider',
  },
  {
    sort: {mode: 'updatedAt', order: 'asc'},
    subtitle: 'Newest first',
    title: 'Last updated',
    type: 'menuItem',
  },
  {
    sort: {mode: 'updatedAt', order: 'desc'},
    subtitle: 'Oldest first',
    title: 'Last updated',
    type: 'menuItem',
  },
  {
    type: 'divider',
  },
  {
    sort: {mode: 'previewTitle', order: 'asc'},
    subtitle: 'A to Z',
    title: 'Title',
    type: 'menuItem',
  },
  {
    sort: {mode: 'previewTitle', order: 'desc'},
    subtitle: 'Z to A',
    title: 'Title',
    type: 'menuItem',
  },
]

const IconWrapperBox = styled(Box)<{$visible: boolean}>`
  visibility: ${({$visible}) => ($visible ? 'visible' : 'hidden')};
`

const SortMenuContentFlex = styled(Flex)<{$small: boolean}>`
  box-sizing: border-box;
  height: ${({$small}) => ($small ? SUBHEADER_HEIGHT_SMALL : SUBHEADER_HEIGHT_LARGE)}px;
`

function CustomMenuItem({
  sort,
  subtitle,
  title,
}: {
  sort: SearchSort
  subtitle?: string
  title: string
}) {
  const {
    dispatch,
    state: {sort: currentSort},
  } = useSearchState()

  const handleClick = useCallback(() => {
    dispatch({sort, type: 'SORT_SET'})
  }, [dispatch, sort])

  const isSelected = useMemo(() => isEqual(currentSort, sort), [currentSort, sort])

  return (
    <MenuItem onClick={handleClick} padding={3} selected={isSelected} tone="default">
      <Flex align="center" justify="space-between" gap={4}>
        <Inline space={1}>
          <Text size={1} weight="semibold">
            {title}
          </Text>
          <Text size={1}>{subtitle}</Text>
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
    state: {sort},
  } = useSearchState()

  const currentMenuItem = MENU_ITEMS.find(
    (item): item is SortMenuItem => item.type === 'menuItem' && isEqual(sort, item.sort)
  )

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
              {MENU_ITEMS.map((item, index) => {
                if (item.type === 'divider') {
                  // eslint-disable-next-line react/no-array-index-key
                  return <MenuDivider key={index} />
                }
                if (item.type === 'menuItem') {
                  return (
                    <CustomMenuItem
                      // eslint-disable-next-line react/no-array-index-key
                      key={index}
                      sort={item.sort}
                      subtitle={item.subtitle}
                      title={item.title}
                    />
                  )
                }
                return null
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
