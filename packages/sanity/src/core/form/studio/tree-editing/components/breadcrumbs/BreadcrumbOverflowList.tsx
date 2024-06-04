import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import {isEqual} from '@sanity/util/paths'
import {useCallback} from 'react'
import {CommandList, type Path, supportsTouch, useTranslation} from 'sanity'

import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../../types'
import {ITEM_HEIGHT} from './constants'

interface BreadcrumbOverflowListProps {
  items: TreeEditingBreadcrumb[]
  onPathSelect: (path: Path) => void
}

export function BreadcrumbOverflowList(props: BreadcrumbOverflowListProps): JSX.Element {
  const {items, onPathSelect} = props
  const {t} = useTranslation()

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
            <Flex align="center" gap={2}>
              <Box flex={1}>
                <Text size={1} textOverflow="ellipsis">
                  / {item.title}
                </Text>
              </Box>
            </Flex>
          </Button>
        </Stack>
      )
    },
    [items, onPathSelect],
  )

  return (
    <CommandList
      activeItemDataAttr="data-hovered"
      ariaLabel={t('tree-editing-dialog.breadcrumbs.menu')}
      autoFocus={supportsTouch ? undefined : 'input'}
      inputElement={null}
      itemHeight={ITEM_HEIGHT}
      items={items}
      overscan={5}
      padding={1}
      renderItem={renderItem}
    />
  )
}
