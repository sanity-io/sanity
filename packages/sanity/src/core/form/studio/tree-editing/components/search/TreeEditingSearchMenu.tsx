import {Box, Button, Stack, Text} from '@sanity/ui'
import {isEqual} from 'lodash'
import {useCallback} from 'react'
import {
  CommandList,
  getSchemaTypeTitle,
  type Path,
  SanityDefaultPreview,
  supportsTouch,
  useTranslation,
} from 'sanity'

import {useValuePreviewWithFallback} from '../../hooks'
import {type TreeEditingMenuItem} from '../../types'
import {ITEM_HEIGHT} from './constants'

interface ResultItemProps {
  item: TreeEditingMenuItem
  onPathSelect: (path: Path) => void
  isFirst: boolean
}

function ResultItem(props: ResultItemProps): JSX.Element {
  const {item, onPathSelect, isFirst} = props

  const {value} = useValuePreviewWithFallback({
    value: item.value,
    schemaType: item.schemaType,
  })

  const title = value.title

  return (
    <Stack marginTop={isFirst ? undefined : 1}>
      <Button
        mode="bleed"
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => onPathSelect(item.path)}
      >
        <Stack space={2} flex={1}>
          <SanityDefaultPreview title={title} media={value.media} layout="inline" />

          <Box>
            <Text muted size={0} textOverflow="ellipsis">
              {getSchemaTypeTitle(item.parentSchemaType)}
            </Text>
          </Box>
        </Stack>
      </Button>
    </Stack>
  )
}

interface TreeEditingSearchMenuProps {
  items: TreeEditingMenuItem[]
  onPathSelect: (path: Path) => void
  textInputElement: HTMLInputElement | null
}

export function TreeEditingSearchMenu(props: TreeEditingSearchMenuProps): JSX.Element {
  const {items, onPathSelect, textInputElement} = props
  const {t} = useTranslation()

  const renderItem = useCallback(
    (item: TreeEditingMenuItem) => {
      const isFirst = isEqual(item.path, items[0].path)

      return <ResultItem isFirst={isFirst} item={item} onPathSelect={onPathSelect} />
    },
    [items, onPathSelect],
  )

  return (
    <CommandList
      activeItemDataAttr="data-hovered"
      ariaLabel={t('tree-editing-dialog.search.menu-label')}
      autoFocus={supportsTouch ? undefined : 'input'}
      inputElement={textInputElement}
      itemHeight={ITEM_HEIGHT}
      items={items}
      overscan={5}
      padding={1}
      renderItem={renderItem}
    />
  )
}
