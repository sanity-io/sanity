import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
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
import {BlockStyleItem} from './types'

type Props = {
  disabled: boolean
  readOnly: boolean
  items: BlockStyleItem[]
  value: BlockStyleItem[]
  isFullscreen?: boolean
}

const StyledMenuItem = styled(MenuItem)`
  * {
    margin: 0;
    color: inherit;
    border-color: inherit;
  }
`

const MENU_POPOVER_PROPS: MenuButtonProps['popover'] = {
  portal: true,
  constrainSize: true,
  placement: 'bottom-start',
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

export default function BlockStyleSelect(props: Props): JSX.Element {
  const {disabled, items, readOnly, value, isFullscreen} = props
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const [changed, setChanged] = useState(false)

  const features = useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [editor])
  const focusBlock = useMemo(() => selection && PortableTextEditor.focusBlock(editor), [
    editor,
    selection,
  ])

  // @todo: Document what's going on here
  const _disabled = useMemo(
    () => (focusBlock ? features.types.block.name !== focusBlock._type : false),
    [features.types.block.name, focusBlock]
  )

  const menuButtonText = useMemo(() => {
    if (value && value.length > 1) {
      return 'Multiple'
    }
    if (value && value.length == 1) {
      return value[0].title
    }
    return 'No style'
  }, [value])

  const menuButtonPadding = useMemo(() => (isFullscreen ? 3 : 2), [isFullscreen])

  const menuButtonDisabled = useMemo(() => _disabled || readOnly || disabled, [
    _disabled,
    disabled,
    readOnly,
  ])

  // Use this effect to set focus back into the editor when the new value get's in.
  useEffect(() => {
    if (changed) {
      PortableTextEditor.focus(editor)
      setChanged(false)
    }
  }, [value, changed, editor])

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

  return (
    <MenuButton
      popover={MENU_POPOVER_PROPS}
      id="block-style-select"
      button={
        <Stack>
          <Button
            disabled={menuButtonDisabled}
            iconRight={SelectIcon}
            mode="bleed"
            onClick={preventDefault}
            padding={menuButtonPadding}
            text={menuButtonText}
          />
        </Stack>
      }
      menu={
        <Menu>
          {items.map((item) => {
            return (
              <StyledMenuItem
                key={item.key}
                pressed={item.active}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => handleChange(item)}
              >
                {renderOption(item.style)}
              </StyledMenuItem>
            )
          })}
        </Menu>
      }
    />
  )
}
