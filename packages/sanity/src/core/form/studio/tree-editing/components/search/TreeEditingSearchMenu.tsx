import {Box, Button, Stack, Text} from '@sanity/ui'
import {isEqual} from 'lodash'
import {useCallback} from 'react'
import {CommandList, type Path, supportsTouch} from 'sanity'

import {type TreeEditingMenuItem} from '../../types'
import {ITEM_HEIGHT} from './constants'

interface TreeEditingSearchMenuProps {
  items: TreeEditingMenuItem[]
  onPathSelect: (path: Path) => void
  textInputElement: HTMLInputElement | null
}

export function TreeEditingSearchMenu(props: TreeEditingSearchMenuProps): JSX.Element {
  const {items, onPathSelect, textInputElement} = props

  const getItemDisabled = useCallback((index: number) => false, [])

  const renderItem = useCallback(
    (item: TreeEditingMenuItem) => {
      const isFirst = isEqual(item.path, items[0].path)

      return (
        <Stack marginTop={isFirst ? undefined : 1}>
          <Button
            mode="bleed"
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => onPathSelect(item.path)}
          >
            <Stack space={2} flex={1}>
              <Box>
                <Text size={1} textOverflow="ellipsis">
                  <b>{item.title}</b>
                </Text>
              </Box>

              <Box>
                <Text muted size={0} textOverflow="ellipsis">
                  {item.parentTitle}
                </Text>
              </Box>
            </Stack>
          </Button>
        </Stack>
      )
    },
    [items, onPathSelect],
  )

  return (
    <CommandList
      activeItemDataAttr="data-hovered"
      // todo: localize
      /* eslint-disable @sanity/i18n/no-attribute-string-literals */
      ariaLabel="Search menu"
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
