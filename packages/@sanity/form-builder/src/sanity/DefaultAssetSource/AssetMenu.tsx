import React from 'react'
import {LinkIcon, EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {AssetAction} from '../../inputs/files/ImageInput/types'
import {DropDownButton} from '../../legacyParts'

const menuItems: AssetAction[] = [
  {
    name: 'showRefs',
    title: 'Show documents using this',
    icon: LinkIcon,
  },
  {
    name: 'delete',
    title: 'Delete',
    color: 'danger',
    icon: TrashIcon,
  },
]

export default function AssetMenu({
  isSelected,
  onAction,
}: {
  isSelected: boolean
  onAction: (action: AssetAction) => void
}) {
  return (
    <DropDownButton
      icon={EllipsisVerticalIcon}
      padding="small"
      placement="bottom-end"
      showArrow={false}
      items={isSelected ? menuItems.filter((item) => item.name !== 'delete') : menuItems}
      onAction={onAction}
    />
  )
}
