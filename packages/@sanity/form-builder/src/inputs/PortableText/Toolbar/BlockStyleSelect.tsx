import React, {memo, useCallback, useEffect, useMemo, useState} from 'react'
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {Button, Menu, MenuButton, MenuButtonProps, MenuItem, Stack, Text} from '@sanity/ui'
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
} from '../Text/TextBlock'
import {useActiveStyleKeys, useFeatures, useFocusBlock} from './hooks'
import {BlockStyleItem} from './types'

const MenuButtonMemo = memo(MenuButton)

interface BlockStyleSelectProps {
  disabled: boolean
  readOnly: boolean
  items: BlockStyleItem[]
}

const StyledMenuItem = styled(MenuItem)`
  * {
    margin: 0;
    color: inherit;
    border-color: inherit;
  }
`

const MENU_POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  placement: 'bottom-start',
  portal: 'default',
}

const TEXT_STYLE_OPTIONS = {
  h1: <Heading1>Heading 1</Heading1>,
  h2: <Heading2>Heading 2</Heading2>,
  h3: <Heading3>Heading 3</Heading3>,
  h4: <Heading4>Heading 4</Heading4>,
  h5: <Heading5>Heading 5</Heading5>,
  h6: <Heading6>Heading 6</Heading6>,
  normal: <Normal>Normal</Normal>,
  blockquote: (
    <BlockQuote>
      <Text>Quote</Text>
    </BlockQuote>
  ),
}

const TEXT_STYLE_KEYS = Object.keys(TEXT_STYLE_OPTIONS)

const preventDefault = (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault()

const emptyStyle: BlockStyleItem = {
  key: 'style-none',
  style: null,
  styleComponent: null,
  title: 'No style',
}

export const BlockStyleSelect = memo(function BlockStyleSelect(
  props: BlockStyleSelectProps
): JSX.Element {
  const {disabled, items: itemsProp, readOnly} = props
  const editor = usePortableTextEditor()
  const features = useFeatures()
  const focusBlock = useFocusBlock()
  const [changed, setChanged] = useState(false)

  // @todo: Explain what this does
  const _disabled = focusBlock ? features.types.block.name !== focusBlock._type : false

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

  // Set focus back into the editor when the new value get's in
  useEffect(() => {
    if (changed) {
      PortableTextEditor.focus(editor)
      setChanged(false)
    }
  }, [activeItems, changed, editor])

  const handleChange = useCallback(
    (item: BlockStyleItem): void => {
      if (focusBlock && item.style !== focusBlock.style) {
        PortableTextEditor.toggleBlockStyle(editor, item.style)
      }
      setChanged(true)
    },
    [editor, focusBlock]
  )

  const renderOption = useCallback((style: string) => {
    const hasTextStyle = TEXT_STYLE_KEYS.includes(style)

    if (hasTextStyle) {
      return TEXT_STYLE_OPTIONS[style]
    }

    return <Text>{style}</Text>
  }, [])

  const button = useMemo(
    () => (
      <Stack>
        <Button
          disabled={_disabled || readOnly || disabled}
          iconRight={SelectIcon}
          mode="bleed"
          onClick={preventDefault}
          padding={2}
          text={menuButtonText}
        />
      </Stack>
    ),
    [_disabled, disabled, menuButtonText, readOnly]
  )

  const menu = useMemo(
    () => (
      <Menu>
        {items.map((item) => {
          return (
            <StyledMenuItem
              key={item.key}
              pressed={activeItems.includes(item)}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => handleChange(item)}
            >
              {renderOption(item.style)}
            </StyledMenuItem>
          )
        })}
      </Menu>
    ),
    [activeItems, handleChange, items, renderOption]
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
