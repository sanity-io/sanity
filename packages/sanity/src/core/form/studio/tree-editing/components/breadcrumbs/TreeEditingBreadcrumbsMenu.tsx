import {CheckmarkIcon} from '@sanity/icons'
import {type Path, type PreviewValue} from '@sanity/types'
import {
  // eslint-disable-next-line no-restricted-imports
  Button, // Custom button needed, support for children
  Flex,
  Stack,
  Text,
} from '@sanity/ui'
import {isEqual} from 'lodash'
import {useCallback} from 'react'

import {CommandList} from '../../../../../components/commandList/CommandList'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {SanityDefaultPreview} from '../../../../../preview/components/SanityDefaultPreview'
import {supportsTouch} from '../../../../../util/supportsTouch'
import {useValuePreviewWithFallback} from '../../hooks'
import {type TreeEditingBreadcrumb} from '../../types'
import {ITEM_HEIGHT} from './constants'

interface BreadcrumbsItemProps {
  item: TreeEditingBreadcrumb
  selected: boolean
  isFirst: boolean
  onPathSelect: (path: Path) => void
  renderMenuItemTitle: (value: PreviewValue) => React.JSX.Element
}

function BreadcrumbsItem(props: BreadcrumbsItemProps): React.JSX.Element {
  const {item, onPathSelect, selected, isFirst, renderMenuItemTitle} = props

  const {value} = useValuePreviewWithFallback({
    schemaType: item.schemaType,
    value: item.value,
  })

  const {title} = value

  return (
    <Stack marginTop={isFirst ? undefined : 1}>
      <Button
        mode="bleed"
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => onPathSelect(item.path)}
        selected={selected}
        title={title}
        padding={2}
      >
        <Flex align="center" gap={3} justify="space-between">
          <Flex flex={1}>{renderMenuItemTitle(value)}</Flex>

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
  collapsed?: boolean
  items: TreeEditingBreadcrumb[]
  onPathSelect: (path: Path) => void
  selectedPath: Path
}

export function TreeEditingBreadcrumbsMenu(
  props: TreeEditingBreadcrumbsMenuProps,
): React.JSX.Element {
  const {items, onPathSelect, selectedPath, collapsed = false} = props
  const {t} = useTranslation()

  const getItemDisabled = useCallback(
    (index: number) => {
      const item = items[index]
      return isEqual(item.path, selectedPath)
    },
    [items, selectedPath],
  )

  const handleRenderMenuItemTitle = useCallback(
    (value: PreviewValue) => {
      const {title, media} = value

      // Render the title of the menu item in the collapsed breadcrumb
      // menu (i.e. the "..." item) with a leading slash.
      if (collapsed) {
        return (
          <Flex align="center" gap={1}>
            <Text size={1} muted>
              /
            </Text>

            <SanityDefaultPreview title={title} media={media} layout="inline" />
          </Flex>
        )
      }

      return <SanityDefaultPreview title={title} media={media} layout="inline" />
    },
    [collapsed],
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
      data-testid="tree-editing-breadcrumbs-menu"
      getItemDisabled={getItemDisabled}
      itemHeight={ITEM_HEIGHT}
      items={items}
      overscan={5}
      padding={1}
      renderItem={renderItem}
    />
  )
}
