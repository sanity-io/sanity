/* eslint-disable react/prop-types */
import React, {FunctionComponent, useCallback, useMemo} from 'react'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'
import {EditIcon, LinkIcon, TrashIcon, EyeOpenIcon} from '@sanity/icons'
import {DropDownButton} from '../../../legacyParts'

import Preview from '../../../Preview'
import {MenuItem, DropDownMenuItemProps} from './BlockObjectMenuItem'

import styles from './BlockObject.module.css'

type Props = {
  type: Type
  value: PortableTextBlock
  readOnly: boolean
  onClickingEdit: () => void
  onClickingDelete: () => void
}

export const BlockObjectPreview: FunctionComponent<Props> = ({
  value,
  type,
  readOnly,
  onClickingEdit,
  onClickingDelete,
}): JSX.Element => {
  const menuItems: DropDownMenuItemProps[] = useMemo(() => {
    const items = []
    if (value._ref) {
      items.push({
        title: 'Go to reference',
        icon: LinkIcon,
        intent: 'edit',
        params: {id: value._ref},
      })
    }
    if (readOnly) {
      items.push({
        title: 'View',
        icon: EyeOpenIcon,
        name: 'view',
      })
    } else {
      items.push({
        title: 'Edit',
        icon: EditIcon,
        name: 'edit',
      })
      items.push({
        title: 'Delete',
        icon: TrashIcon,
        name: 'delete',
        color: 'danger',
      })
    }
    return items
  }, [readOnly, value._ref])

  const handleHeaderMenuAction = useCallback(
    (item: DropDownMenuItemProps): void => {
      if (item.name === 'delete') {
        onClickingDelete()
      }
      if (item.name === 'edit') {
        onClickingEdit()
      }
      if (item.name === 'view') {
        onClickingEdit()
      }
    },
    [onClickingDelete, onClickingEdit]
  )

  return (
    <div className={styles.preview}>
      <Preview type={type} value={value} layout="block" />
      <div className={styles.header}>
        <DropDownButton
          items={menuItems}
          kind="simple"
          onAction={handleHeaderMenuAction}
          padding="small"
          placement="bottom-end"
          renderItem={MenuItem}
        >
          {type ? type.title || type.name : 'Unknown'}
        </DropDownButton>
      </div>
    </div>
  )
}
