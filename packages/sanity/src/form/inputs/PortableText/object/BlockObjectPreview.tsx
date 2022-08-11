import {EditIcon, LinkIcon, TrashIcon, EyeOpenIcon, EllipsisVerticalIcon} from '@sanity/icons'
import {
  PortableTextBlock,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuButtonProps,
  MenuItem,
  useGlobalKeyDown,
  useLayer,
} from '@sanity/ui'
import React, {forwardRef, MouseEvent, ReactElement, useCallback, useMemo, useRef} from 'react'
import {useId} from '@reach/auto-id'
import {ObjectSchemaType} from '@sanity/types'
import {IntentLink} from '../../../../router'
import {FIXME, RenderPreviewCallback} from '../../../types'
import {is} from '../../../utils/is'

interface BlockObjectPreviewProps {
  focused: boolean
  type: ObjectSchemaType
  value: PortableTextBlock
  readOnly?: boolean
  onClickingEdit: () => void
  onClickingDelete: (event: MouseEvent) => void
  renderPreview: RenderPreviewCallback
}

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  placement: 'bottom',
  portal: 'default',
  tone: 'default',
}

export function BlockObjectPreview(props: BlockObjectPreviewProps): ReactElement {
  const {focused, value, type, readOnly, onClickingEdit, onClickingDelete, renderPreview} = props
  const {isTopLayer} = useLayer()
  const editor = usePortableTextEditor()
  const menuButtonId = useId() || ''
  const menuButton = useRef<HTMLButtonElement | null>(null)
  const isTabbing = useRef<boolean>(false)
  const isCustomPreviewComponent = Boolean((type.preview as FIXME)?.component)
  const isImageType = is('image', type)

  const referenceLink = useMemo(
    () =>
      forwardRef(function ReferenceLink(linkProps: FIXME, ref: FIXME) {
        return <IntentLink {...linkProps} intent="edit" params={{id: value._ref}} ref={ref} />
      }),
    [value?._ref]
  )

  // Go to menu when tabbed to
  // Focus block on escape
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (!focused) {
          return
        }
        if (event.key === 'Escape' && isTopLayer) {
          // event.preventDefault()
          // event.stopPropagation()
          isTabbing.current = false
          PortableTextEditor.focus(editor)
        }
        if (event.key === 'Tab') {
          if (menuButton.current && !isTabbing.current) {
            event.preventDefault()
            event.stopPropagation()
            menuButton.current.focus()
            isTabbing.current = true
          }
        }
      },
      [focused, isTopLayer, editor]
    )
  )

  const actions = (
    <MenuButton
      button={
        <Button
          aria-label="Open menu"
          fontSize={1}
          iconRight={EllipsisVerticalIcon}
          mode="bleed"
          paddingX={2}
        />
      }
      ref={menuButton}
      id={menuButtonId}
      menu={
        <Menu>
          {value?._ref && (
            <MenuItem as={referenceLink} data-as="a" icon={LinkIcon} text="Open reference" />
          )}

          {readOnly && <MenuItem icon={EyeOpenIcon} onClick={onClickingEdit} text="View" />}
          {!readOnly && <MenuItem icon={EditIcon} onClick={onClickingEdit} text="Edit" />}
          {!readOnly && (
            <MenuItem icon={TrashIcon} onClick={onClickingDelete} text="Delete" tone="critical" />
          )}
        </Menu>
      }
      popover={POPOVER_PROPS}
    />
  )

  if (isCustomPreviewComponent) {
    return (
      <Flex>
        <Box flex={1}>
          {renderPreview({
            layout: isImageType ? 'blockImage' : 'block',
            schemaType: type,
            value,
          })}
        </Box>
        <Box marginLeft={1}>{actions}</Box>
      </Flex>
    )
  }

  return (
    <>
      {renderPreview({
        actions,
        layout: isImageType ? 'blockImage' : 'block',
        schemaType: type,
        value,
      })}
    </>
  )
}
