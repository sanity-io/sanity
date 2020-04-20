/* eslint-disable react/no-multi-comp */
import React from 'react'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'

import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import EditIcon from 'part:@sanity/base/edit-icon'
import LinkIcon from 'part:@sanity/base/link-icon'
import {IntentLink} from 'part:@sanity/base/router'
import TrashIcon from 'part:@sanity/base/trash-icon'
import VisibilityIcon from 'part:@sanity/base/visibility-icon'
import PatchEvent, {unset} from '../../../PatchEvent'

import Preview from '../../../Preview'
import {Path} from '@sanity/portable-text-editor/lib/types/path'

type DropDownButtonItem = {
  title: string
  icon: React.ComponentType
  color?: string
  intent?: 'edit' | string
  params?: Record<string, any>
  name?: string
}

const MenuItem = (props: DropDownButtonItem): JSX.Element => {
  const {title, color, icon, intent, params} = props
  const Icon = icon
  return (
    // TODO: styling
    // <div className={color === 'danger' ? styles.menuItemDanger : styles.menuItem}>
    <div>
      {intent ? (
        <IntentLink intent={intent} params={params}>
          {Icon && <Icon />}
          {title}
        </IntentLink>
      ) : (
        <>
          {Icon && <Icon />}
          &nbsp;
          {title}
        </>
      )}
    </div>
  )
}

type BlockPreviewProps = {
  type: Type
  block: PortableTextBlock
  path: Path
  readOnly: boolean
  onFocus: (arg0: Path) => void
  onClickingEdit: () => void
  onClickingDelete: (patchEvent: PatchEvent) => void
}

const BlockPreview = (props: BlockPreviewProps): JSX.Element => {
  const {type, block, path, readOnly, onFocus, onClickingEdit, onClickingDelete} = props

  const menuItems: DropDownButtonItem[] = []
  if (block._ref) {
    menuItems.push({
      title: 'Go to reference',
      icon: LinkIcon,
      intent: 'edit',
      params: {id: block._ref}
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

  const handleHeaderMenuAction = (item: DropDownButtonItem): void => {
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
      onFocus([{_key: block._key}, FOCUS_TERMINATOR])
    }
  }

  return (
    // TODO: styling
    // <div className={styles.preview}>
    <div>
      <Preview type={type} value={block} layout="block" />
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

export default BlockPreview
