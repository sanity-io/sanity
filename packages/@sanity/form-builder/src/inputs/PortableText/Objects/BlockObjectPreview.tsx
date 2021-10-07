import {IntentLink} from '@sanity/base/router'
import {EditIcon, LinkIcon, TrashIcon, EyeOpenIcon, ChevronDownIcon} from '@sanity/icons'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'
import {Button, Menu, MenuButton, MenuItem} from '@sanity/ui'
import React, {useCallback} from 'react'
import Preview from '../../../Preview'

interface BlockObjectPreviewProps {
  type: Type
  value: PortableTextBlock
  readOnly: boolean
  onClickingEdit: () => void
  onClickingDelete: () => void
}

export function BlockObjectPreview(props: BlockObjectPreviewProps) {
  const {value, type, readOnly, onClickingEdit, onClickingDelete} = props

  const ReferenceLink = useCallback(
    (linkProps: any) => <IntentLink {...linkProps} intent="edit" params={{id: value._ref}} />,
    [value?._ref]
  )

  return (
    <Preview
      actions={
        <MenuButton
          button={
            <Button
              fontSize={1}
              iconRight={ChevronDownIcon}
              mode="ghost"
              text={type ? type.title || type.name : 'Unknown'}
            />
          }
          // @todo
          id=""
          menu={
            <Menu>
              {value?._ref && <MenuItem as={ReferenceLink} icon={LinkIcon} text="Open reference" />}
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
          popover={{constrainSize: true, placement: 'bottom-end', portal: true}}
        />
      }
      type={type}
      value={value}
      layout="block"
    />
  )
}
