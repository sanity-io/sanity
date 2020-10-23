import LinkIcon from 'part:@sanity/base/link-icon'
import MoreVertIcon from 'part:@sanity/base/more-vert-icon'
import TrashIcon from 'part:@sanity/base/trash-icon'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import React from 'react'
import {AssetAction} from './types'

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
      icon={MoreVertIcon}
      padding="small"
      placement="bottom-end"
      showArrow={false}
      items={isSelected ? menuItems.filter((item) => item.name !== 'delete') : menuItems}
      onAction={onAction}
    />
  )
}
