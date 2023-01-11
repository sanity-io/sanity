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
  useEffect,
} from 'react'
import {ObjectSchemaType, PortableTextBlock} from '@sanity/types'
import {RenderPreviewCallback} from '../../../types'
import {is} from '../../../utils/is'
import {IntentLink} from 'sanity/router'

interface BlockObjectPreviewProps {
  focused: boolean
  isActive?: boolean
  onClickingDelete: (event: MouseEvent) => void
  onClickingEdit: () => void
  readOnly?: boolean
  renderPreview: RenderPreviewCallback
  type: ObjectSchemaType
  value: PortableTextBlock
  isOpen?: boolean
}

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  placement: 'bottom',
  portal: 'default',
  tone: 'default',
}

export function BlockObjectPreview(props: BlockObjectPreviewProps): ReactElement {
  const {
    focused,
    isActive,
    onClickingDelete,
    onClickingEdit,
    readOnly,
    renderPreview,
    type,
    value,
    isOpen,
  } = props
  const {isTopLayer} = useLayer()
  const editor = usePortableTextEditor()
  const menuButtonId = useId()
  const menuButton = useRef<HTMLButtonElement | null>(null)
  const isTabbing = useRef<boolean>(false)
  const isImageType = is('image', type)

  const referenceLink = useMemo(
    () =>
      '_ref' in value && value._ref
        ? forwardRef(function ReferenceLink(
            linkProps,
            ref: React.Ref<HTMLAnchorElement> | undefined
          ) {
            return <IntentLink {...linkProps} intent="edit" params={{id: value._ref}} ref={ref} />
          })
        : undefined,
    [value]
  )

  useEffect(() => {
    if (isOpen) {
      isTabbing.current = false
    }
  }, [isOpen])

  // Go to menu when tabbed to
  // Focus block on escape
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (!focused) {
          return
        }
        if (event.key === 'Tab') {
          if (menuButton.current && !isTabbing.current && !isOpen) {
            event.preventDefault()
            event.stopPropagation()
            menuButton.current.focus()
            isTabbing.current = true
          }
        }
      },
      [focused, isTopLayer, editor, isOpen]
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
            {'_ref' in value && value._ref && (
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
        schemaType: type,
        value,
      })}
    </>
  )
}
