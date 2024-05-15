import {CheckmarkIcon} from '@sanity/icons'
import {Button, Stack} from '@sanity/ui'
import {isEqual} from 'lodash'
import {useCallback} from 'react'
import {CommandList, type Path, supportsTouch} from 'sanity'

import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../../types'
import {ITEM_HEIGHT} from './constants'

// const ContentFlex = styled(Flex)`
//   min-height: 100px;
// `

interface TreeEditingBreadcrumbsMenuProps {
  items: TreeEditingBreadcrumb[]
  onPathSelect: (path: Path) => void
  selectedPath: Path
  textInputElement: HTMLInputElement | null
}

export function TreeEditingBreadcrumbsMenu(props: TreeEditingBreadcrumbsMenuProps): JSX.Element {
  const {items, onPathSelect, selectedPath, textInputElement} = props
  // const hasOptions = items.length > 0

  const getItemDisabled = useCallback((index: number) => false, [])

  const renderItem = useCallback(
    (item: TreeEditingMenuItem) => {
      const selected = isEqual(item.path, selectedPath)
      const isFirst = isEqual(item.path, items[0].path)

      const iconRight = selected ? CheckmarkIcon : undefined
      const justify = selected ? 'space-between' : 'flex-start'

      return (
        <Stack marginTop={isFirst ? undefined : 1}>
          <Button
            iconRight={iconRight}
            justify={justify}
            mode="bleed"
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => onPathSelect(item.path)}
            selected={selected}
            text={item.title}
          />
        </Stack>
      )
    },
    [items, onPathSelect, selectedPath],
  )

  // Render no options state
  // if (!hasOptions) {
  //   return (
  //     <ContentFlex
  //       align="center"
  //       flex={1}
  //       height="fill"
  //       justify="center"
  //       padding={4}
  //       sizing="border"
  //     >
  //       <Text align="center" muted size={1}>
  //         No options
  //       </Text>
  //     </ContentFlex>
  //   )
  // }

  return (
    <CommandList
      activeItemDataAttr="data-hovered"
      ariaLabel="test" // todo: replace with actual value
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
