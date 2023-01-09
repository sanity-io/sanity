import {EditIcon, LinkIcon, TrashIcon, EyeOpenIcon, EllipsisVerticalIcon} from '@sanity/icons'
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {
  Button,
  Menu,
  MenuButton,
  MenuButtonProps,
  MenuItem,
  useGlobalKeyDown,
  useLayer,
} from '@sanity/ui'
import React, {
  forwardRef,
  MouseEvent,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useId,
} from 'react'
import {RenderPreviewCallback} from '../../../types'
import {is} from '../../../utils/is'
import {PortableTextMemberItem} from '../PortableTextInput'
import {IntentLink} from 'sanity/router'

interface BlockObjectPreviewProps {
  focused: boolean
  isActive?: boolean
  memberItem: PortableTextMemberItem
  onClickingDelete: (event: MouseEvent) => void
  onClickingEdit: () => void
  readOnly?: boolean
  renderPreview: RenderPreviewCallback
}

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  placement: 'bottom',
  portal: 'default',
  tone: 'default',
}

export function BlockObjectPreview(props: BlockObjectPreviewProps): ReactElement {
  const {focused, isActive, memberItem, onClickingDelete, onClickingEdit, readOnly, renderPreview} =
    props
  const {isTopLayer} = useLayer()
  const editor = usePortableTextEditor()
  const menuButtonId = useId()
  const menuButton = useRef<HTMLButtonElement | null>(null)
  const {schemaType, value} = memberItem.node
  const isImageType = is('image', schemaType)

  const referenceLink = useMemo(
    () =>
      value && '_ref' in value && value._ref
        ? forwardRef(function ReferenceLink(
            linkProps,
            ref: React.Ref<HTMLAnchorElement> | undefined
          ) {
            return <IntentLink {...linkProps} intent="edit" params={{id: value._ref}} ref={ref} />
          })
        : undefined,
    [value]
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
          PortableTextEditor.focus(editor)
        }
        if (event.key === 'Tab') {
          if (menuButton.current && focused && !memberItem.member.open) {
            event.preventDefault()
            event.stopPropagation()
            menuButton.current.focus()
          }
        }
      },
      [focused, isTopLayer, editor, memberItem.member.open]
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
          tabIndex={isActive ? 0 : 1}
        />
      }
      ref={menuButton}
      id={menuButtonId}
      menu={
        <Menu>
          <>
            {value && '_ref' in value && value._ref && (
              <MenuItem as={referenceLink} data-as="a" icon={LinkIcon} text="Open reference" />
            )}

            {readOnly && <MenuItem icon={EyeOpenIcon} onClick={onClickingEdit} text="View" />}
            {!readOnly && <MenuItem icon={EditIcon} onClick={onClickingEdit} text="Edit" />}
            {!readOnly && (
              <MenuItem icon={TrashIcon} onClick={onClickingDelete} text="Delete" tone="critical" />
            )}
          </>
        </Menu>
      }
      popover={POPOVER_PROPS}
    />
  )

  return (
    <>
      {renderPreview({
        actions,
        layout: isImageType ? 'blockImage' : 'block',
        schemaType,
        value,
      })}
    </>
  )
}
