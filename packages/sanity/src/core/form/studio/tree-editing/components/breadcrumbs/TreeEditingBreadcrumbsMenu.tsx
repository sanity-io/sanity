import {CheckmarkIcon} from '@sanity/icons'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import {isEqual} from 'lodash'
import {useCallback} from 'react'
import {CommandList, type Path, supportsTouch} from 'sanity'

import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../../types'
import {ITEM_HEIGHT} from './constants'

interface TreeEditingBreadcrumbsMenuProps {
  items: TreeEditingBreadcrumb[]
  onPathSelect: (path: Path) => void
  selectedPath: Path
  textInputElement: HTMLInputElement | null
}

export function TreeEditingBreadcrumbsMenu(props: TreeEditingBreadcrumbsMenuProps): JSX.Element {
  const {items, onPathSelect, selectedPath, textInputElement} = props

  const getItemDisabled = useCallback((index: number) => false, [])

  const renderItem = useCallback(
    (item: TreeEditingMenuItem) => {
      const selected = isEqual(item.path, selectedPath)
      const isFirst = isEqual(item.path, items[0].path)

      return (
        <Stack marginTop={isFirst ? undefined : 1}>
          <Button
            mode="bleed"
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => onPathSelect(item.path)}
            selected={selected}
          >
            <Flex align="center" gap={2}>
              <Box flex={1}>
                <Text size={1} textOverflow="ellipsis">
                  {item.title}
                </Text>
              </Box>

              {selected && (
                <Text size={1}>
                  <CheckmarkIcon />
                </Text>
              )}
            </Flex>
          </Button>
        </Stack>
      )
    },
    [items, onPathSelect, selectedPath],
  )

  return (
    <CommandList
      activeItemDataAttr="data-hovered"
      // todo: localize
      /* eslint-disable @sanity/i18n/no-attribute-string-literals */
      ariaLabel="Breadcrumb menu"
      autoFocus={supportsTouch ? undefined : 'input'}
      getItemDisabled={getItemDisabled}
      inputElement={textInputElement}
      itemHeight={ITEM_HEIGHT}
      items={items}
      overscan={5}
      padding={1}
      renderItem={renderItem}
    />
  )
}
