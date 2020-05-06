/* eslint-disable react/prop-types */
import React, {FunctionComponent, SyntheticEvent} from 'react'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'

import {Path} from '@sanity/portable-text-editor/lib/types/path'
import EditIcon from 'part:@sanity/base/edit-icon'
import LinkIcon from 'part:@sanity/base/link-icon'
import TrashIcon from 'part:@sanity/base/trash-icon'
import VisibilityIcon from 'part:@sanity/base/visibility-icon'

import {MenuItem, DropDownMenuItemProps} from './BlockObjectMenuItem'
import Preview from '../../../Preview'

import styles from './BlockObject.css'

type Props = {
  type: Type
  value: PortableTextBlock
  path: Path
  readOnly: boolean
  onFocus: (arg0: Path) => void
  onClickingEdit: () => void
  onClickingDelete: () => void
}

export const BlockObjectPreview: FunctionComponent<Props> = ({
  value,
  type,
  readOnly,
  onClickingEdit,
  onClickingDelete
}): JSX.Element => {
  const menuItems: DropDownMenuItemProps[] = []
  if (value._ref) {
    menuItems.push({
      title: 'Go to reference',
      icon: LinkIcon,
      intent: 'edit',
      params: {id: value._ref}
    })
  }
  if (readOnly) {
    menuItems.push({
      title: 'View',
      icon: VisibilityIcon,
      name: 'view'
    })
  } else {
    menuItems.push({
      title: 'Edit',
      icon: EditIcon,
      name: 'edit'
    })
    menuItems.push({
      title: 'Delete',
      icon: TrashIcon,
      name: 'delete',
      color: 'danger'
    })
  }

  const handleHeaderMenuAction = (item: DropDownMenuItemProps): void => {
    if (item.name === 'delete') {
      onClickingDelete()
    }
    if (item.name === 'edit') {
      onClickingEdit()
    }
    if (item.name === 'view') {
      onClickingEdit()
    }
  }

  const stopPropagation = (event: SyntheticEvent<HTMLDivElement>): void => {
    event.stopPropagation()
  }

  return (
    <div className={styles.preview}>
      <Preview type={type} value={value} layout="block" />
      <div className={styles.header} onClick={stopPropagation}>
        <DropDownButton
          placement="bottom-end"
          items={menuItems}
          onAction={handleHeaderMenuAction}
          renderItem={MenuItem}
        >
          {type ? type.title || type.name : 'Unknown'}
        </DropDownButton>
      </div>
    </div>
  )
}
