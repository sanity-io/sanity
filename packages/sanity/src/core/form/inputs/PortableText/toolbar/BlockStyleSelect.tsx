import React, {memo, useCallback, useMemo} from 'react'
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {Menu, MenuButton, MenuButtonProps, MenuItem, Text} from '@sanity/ui'
import {SelectIcon} from '@sanity/icons'
import styled from 'styled-components'
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  BlockQuote,
  Normal,
} from '../text/textStyles'
import {Button} from '../../../../../ui'
import {useActiveStyleKeys, useFocusBlock} from './hooks'
import {BlockStyleItem} from './types'

const MenuButtonMemo = memo(MenuButton)

interface BlockStyleSelectProps {
  disabled: boolean
  items: BlockStyleItem[]
}

const StyledMenuItem = styled(MenuItem)`
  // Change the border color variable used by BlockQuote
  // to make the border visible when the MenuItem is selected
  &[data-selected] {
    [data-option='blockquote'] {
      --card-border-color: var(--card-muted-fg-color);
    }
  }
`

const MENU_POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  placement: 'bottom-start',
  portal: 'default',
}

const TEXT_STYLE_OPTIONS: Record<string, (title: React.ReactNode) => React.ReactNode> = {
  h1: (title) => <Heading1>{title}</Heading1>,
  h2: (title) => <Heading2>{title}</Heading2>,
  h3: (title) => <Heading3>{title}</Heading3>,
  h4: (title) => <Heading4>{title}</Heading4>,
  h5: (title) => <Heading5>{title}</Heading5>,
  h6: (title) => <Heading6>{title}</Heading6>,
  normal: (title) => <Normal>{title}</Normal>,
  blockquote: (title) => <BlockQuote data-option="blockquote">{title}</BlockQuote>,
}

const TEXT_STYLE_KEYS = Object.keys(TEXT_STYLE_OPTIONS)

const preventDefault = (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault()

const emptyStyle: BlockStyleItem = {
  key: 'style-none',
  style: '',
  title: 'No style',
}

export const BlockStyleSelect = memo(function BlockStyleSelect(
  props: BlockStyleSelectProps,
): JSX.Element {
  const {disabled, items: itemsProp} = props
  const editor = usePortableTextEditor()
  const focusBlock = useFocusBlock()

  const _disabled =
    disabled || (focusBlock ? editor.schemaTypes.block.name !== focusBlock._type : false)

  // @todo: Explain what this does
  const activeKeys = useActiveStyleKeys({items: itemsProp})

  const {activeItems, items} = useMemo(() => {
    const _activeItems = itemsProp.filter((item) => activeKeys.includes(item.style))

    let _items = itemsProp

    if (_activeItems.length === 0 && _items.length > 1) {
      _items = _items.concat([emptyStyle])
      _activeItems.push(emptyStyle)
    }

    return {activeItems: _activeItems, items: _items}
  }, [activeKeys, itemsProp])

  const menuButtonText = useMemo(() => {
    if (activeItems.length > 1) return 'Multiple'
    if (activeItems.length === 1) return activeItems[0].title
    return emptyStyle.title
  }, [activeItems])

  const handleChange = useCallback(
    (item: BlockStyleItem): void => {
      if (focusBlock && item.style !== focusBlock.style) {
        // This must be done in the next tick for the focus to stick
        setTimeout(() => {
          PortableTextEditor.toggleBlockStyle(editor, item.style)
          PortableTextEditor.focus(editor)
        })
      }
    },
    [editor, focusBlock],
  )

  const renderOption = useCallback((style: string, title: string) => {
    const hasTextStyle = TEXT_STYLE_KEYS.includes(style)
    const renderStyle = TEXT_STYLE_OPTIONS[style]

    if (hasTextStyle) {
      return renderStyle(title)
    }

    return <Text>{title}</Text>
  }, [])

  const button = useMemo(
    () => (
      <Button
        disabled={_disabled}
        iconRight={SelectIcon}
        mode="bleed"
        onClick={preventDefault}
        size="small"
        text={menuButtonText}
        width="fill"
      />
    ),
    [_disabled, menuButtonText],
  )

  const menu = useMemo(
    () => (
      <Menu disabled={_disabled}>
        {items.map((item) => {
          return (
            <StyledMenuItem
              key={item.key}
              pressed={activeItems.includes(item)}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={_disabled ? undefined : () => handleChange(item)}
            >
              {renderOption(item.style, item?.title || item.style)}
            </StyledMenuItem>
          )
        })}
      </Menu>
    ),
    [_disabled, activeItems, handleChange, items, renderOption],
  )

  return (
    <MenuButtonMemo
      popover={MENU_POPOVER_PROPS}
      id="block-style-select"
      button={button}
      menu={menu}
    />
  )
})
