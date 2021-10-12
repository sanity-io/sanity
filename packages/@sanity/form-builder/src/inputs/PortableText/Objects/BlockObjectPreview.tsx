import {IntentLink} from '@sanity/base/router'
import {EditIcon, LinkIcon, TrashIcon, EyeOpenIcon, EllipsisVerticalIcon} from '@sanity/icons'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'
import {Button, Menu, MenuButton, MenuButtonProps, MenuItem} from '@sanity/ui'
import React, {forwardRef, useMemo} from 'react'
import {useId} from '@reach/auto-id'
import Preview from '../../../Preview'

interface BlockObjectPreviewProps {
  type: Type
  value: PortableTextBlock
  readOnly: boolean
  onClickingEdit: () => void
  onClickingDelete: () => void
}

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  placement: 'bottom',
  portal: true,
  tone: 'default',
}

export function BlockObjectPreview(props: BlockObjectPreviewProps) {
  const {value, type, readOnly, onClickingEdit, onClickingDelete} = props
  const menuButtonId = useId()

  const ReferenceLink = useMemo(
    () =>
      // eslint-disable-next-line no-shadow
      forwardRef(function ReferenceLink(linkProps: any, ref: any) {
        return <IntentLink {...linkProps} intent="edit" params={{id: value._ref}} ref={ref} />
      }),
    [value?._ref]
  )

  return (
    <Preview
      actions={
        <MenuButton
          button={
            <Button
              fontSize={1}
              iconRight={EllipsisVerticalIcon}
              mode="bleed"
              aria-label="Open menu"
            />
          }
          id={menuButtonId}
          menu={
            <Menu>
              {value?._ref && (
                <MenuItem as={ReferenceLink} data-as="a" icon={LinkIcon} text="Open reference" />
              )}
              {readOnly && <MenuItem icon={EyeOpenIcon} onClick={onClickingEdit} text="View" />}
              {!readOnly && <MenuItem icon={EditIcon} onClick={onClickingEdit} text="Edit" />}
              {!readOnly && (
                <MenuItem
                  icon={TrashIcon}
                  onClick={onClickingDelete}
                  text="Delete"
                  tone="critical"
                />
              )}
            </Menu>
          }
          popover={POPOVER_PROPS}
        />
      }
      type={type}
      value={value}
      layout="block"
    />
  )
}
