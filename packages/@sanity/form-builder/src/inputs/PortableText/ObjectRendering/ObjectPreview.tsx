/* eslint-disable react/prop-types */
/* eslint-disable react/no-multi-comp */
import React, {FunctionComponent} from 'react'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'

import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import {MenuItem, DropDownMenuItemProps} from './MenuItem'
import EditIcon from 'part:@sanity/base/edit-icon'
import LinkIcon from 'part:@sanity/base/link-icon'
import TrashIcon from 'part:@sanity/base/trash-icon'
import VisibilityIcon from 'part:@sanity/base/visibility-icon'
import PatchEvent, {unset} from '../../../PatchEvent'

import Preview from '../../../Preview'
import {Path} from '@sanity/portable-text-editor/lib/types/path'

type Props = {
  type: Type
  value: PortableTextBlock
  path: Path
  readOnly: boolean
  onFocus: (arg0: Path) => void
  onClickingEdit: () => void
  onClickingDelete: (patchEvent: PatchEvent) => void
}

export const ObjectPreview: FunctionComponent<Props> = ({
  value,
  type,
  path,
  readOnly,
  onFocus,
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
    // const {node, editor} = this.props
    if (item.name === 'delete') {
      onClickingDelete(PatchEvent.from([unset(path)]))
      // TODO: We may not need this. Double-check that.
      // editor.removeNodeByKey(node.key).focus()
    }
    if (item.name === 'edit') {
      onClickingEdit()
    }
    if (item.name === 'view') {
      onFocus([{_key: value._key}, FOCUS_TERMINATOR])
    }
  }

  return (
    // TODO: styling
    // <div className={styles.preview}>
    <div>
      <Preview type={type} value={value} layout="block" />
      {/* <div className={styles.header}> */}
      <div>
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
