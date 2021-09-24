import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {
  PortableTextEditor,
  RenderBlockFunction,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {Button, Menu, MenuButton, MenuButtonProps, MenuItem, Stack} from '@sanity/ui'
import {SelectIcon} from '@sanity/icons'
import styled from 'styled-components'
import {BlockStyleItem} from './types'

type Props = {
  disabled: boolean
  readOnly: boolean
  renderBlock: RenderBlockFunction
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

const preventDefault = (event: any) => event.preventDefault()

export default function BlockStyleSelect(props: Props): JSX.Element {
  const {disabled, items, readOnly, renderBlock, value, isFullscreen} = props
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const [changed, setChanged] = useState(false)

  const features = useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [editor])
  const focusBlock = useMemo(() => selection && PortableTextEditor.focusBlock(editor), [
    editor,
    selection,
  ])
  const blockType = features.types.block
  const spanType = features.types.span

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

  const renderItem = useCallback(
    (item: BlockStyleItem): JSX.Element => {
      if (item.style) {
        const StyleComponent = item.styleComponent

        return renderBlock(
          {
            _key: '1',
            _type: blockType.name,
            children: [
              {
                _key: '2',
                _type: spanType.name,
                text: item.title,
              },
            ],
            style: item.style,
          },
          blockType,
          {focused: false, selected: false, path: []},
          () =>
            StyleComponent ? <StyleComponent>{item.title}</StyleComponent> : <>{item.title}</>,
          // @todo: remove this:
          React.createRef()
        )
      }

      return <div key={item.key}>No style</div>
    },
    [blockType, renderBlock, spanType.name]
  )

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
                padding={2}
                key={item.key}
                pressed={item.active}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => handleChange(item)}
              >
                {renderItem(item)}
              </StyledMenuItem>
            )
          })}
        </Menu>
      }
    />
  )
}
