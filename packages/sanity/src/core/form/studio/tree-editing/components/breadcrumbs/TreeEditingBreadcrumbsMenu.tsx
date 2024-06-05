import {CheckmarkIcon} from '@sanity/icons'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import {isEqual} from 'lodash'
import {useCallback} from 'react'
import {
  CommandList,
  type Path,
  supportsTouch,
  unstable_useValuePreview as useValuePreview,
  useTranslation,
} from 'sanity'

import {type TreeEditingBreadcrumb} from '../../types'
import {ITEM_HEIGHT} from './constants'

interface BreadcrumbsItemProps {
  item: TreeEditingBreadcrumb
  selected: boolean
  isFirst: boolean
  onPathSelect: (path: Path) => void
  renderMenuItemTitle: (title: string) => string
}

function BreadcrumbsItem(props: BreadcrumbsItemProps): JSX.Element {
  const {item, onPathSelect, selected, isFirst, renderMenuItemTitle} = props

  const {value} = useValuePreview({
    schemaType: item.schemaType,
    value: item.value,
  })

  const title = value?.title || 'Untitled'

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
              {renderMenuItemTitle(title)}
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
}

interface TreeEditingBreadcrumbsMenuProps {
  items: TreeEditingBreadcrumb[]
  onPathSelect: (path: Path) => void
  renderMenuItemTitle?: (title: string) => string
  selectedPath: Path
}

export function TreeEditingBreadcrumbsMenu(props: TreeEditingBreadcrumbsMenuProps): JSX.Element {
  const {items, onPathSelect, renderMenuItemTitle, selectedPath} = props
  const {t} = useTranslation()

  const getItemDisabled = useCallback(
    (index: number) => {
      const item = items[index]
      return isEqual(item.path, selectedPath)
    },
    [items, selectedPath],
  )

  const handleRenderMenuItemTitle = useCallback(
    (title: string) => {
      if (renderMenuItemTitle) {
        return renderMenuItemTitle(title)
      }

      return title
    },
    [renderMenuItemTitle],
  )

  const renderItem = useCallback(
    (item: TreeEditingBreadcrumb) => {
      const selected = isEqual(item.path, selectedPath)
      const isFirst = isEqual(item.path, items[0].path)

      return (
        <BreadcrumbsItem
          isFirst={isFirst}
          item={item}
          onPathSelect={onPathSelect}
          renderMenuItemTitle={handleRenderMenuItemTitle}
          selected={selected}
        />
      )
    },
    [handleRenderMenuItemTitle, items, onPathSelect, selectedPath],
  )

  return (
    <CommandList
      activeItemDataAttr="data-hovered"
      ariaLabel={t('tree-editing-dialog.breadcrumbs.menu')}
      autoFocus={supportsTouch ? undefined : 'input'}
      getItemDisabled={getItemDisabled}
      itemHeight={ITEM_HEIGHT}
      items={items}
      overscan={5}
      padding={1}
      renderItem={renderItem}
    />
  )
}
