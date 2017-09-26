// @flow
import type {ItemValue, Type} from './types'

import React from 'react'
import styles from './styles/ItemValue.css'
import Preview from '../../Preview'
import ConfirmButton from './ConfirmButton'

import TrashIcon from 'part:@sanity/base/trash-icon'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'

import ItemForm from './ItemForm'
import MemberValue from '../../Member'
import PatchEvent from '../../PatchEvent'
import UploadPreview from './UploadPreview'

import {DragHandle} from 'part:@sanity/components/lists/sortable'
import {resolveTypeName} from '../../utils/resolveTypeName'

type Props = {
  type: Type,
  value: ItemValue,
  level: number,
  layout: 'media' | 'default',
  onRemove: (ItemValue) => void,
  onChange: (PatchEvent, ItemValue) => void,
  onEditStart: (ItemValue) => void,
  onEditStop: (ItemValue) => void,
  isEditing: boolean
}
export default class Item<T: ItemValue> extends React.Component<*, Props, *> {
  props: Props

  domElement: HTMLElement

  handleRemove = () => {
    const {onRemove, value} = this.props
    onRemove(value)
  }

  handleEditStart = () => {
    const {value, onEditStart} = this.props
    onEditStart(value)
  }

  handleEditStop = () => {
    const {value, onEditStop} = this.props
    onEditStop(value)
  }

  handleKeyPress = event => {
    const {value, onEditStart} = this.props
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onEditStart(value)
    }
  }

  getMemberType(): ?Type {
    const {value, type} = this.props
    const itemTypeName = resolveTypeName(value)
    return type.of.find(memberType => memberType.name === itemTypeName)
  }

  renderEditItemForm(item: any): ?React.Element<any> {
    const {type, onChange, onRemove} = this.props
    const options = type.options || {}

    const memberType = this.getMemberType() || {}

    // Reset level if a full screen modal
    const level = options.editModal === 'fullscreen' ? 1 : this.props.level + 1

    const content = (
      <MemberValue path={{_key: item._key}}>
        <ItemForm
          autoFocus
          itemKey={item._key}
          type={memberType}
          level={level}
          value={item}
          onChange={onChange}
          onRemove={onRemove}
        />
      </MemberValue>
    )

    if (options.editModal === 'fullscreen') {
      return (
        <FullscreenDialog title={memberType.title} onClose={this.handleEditStop} isOpen>
          {content}
        </FullscreenDialog>
      )
    }

    if (options.editModal === 'fold') {
      return (
        <div className={styles.popupAnchorRelative}>
          <EditItemFold title={memberType.title} onClose={this.handleEditStop}>
            {content}
          </EditItemFold>
        </div>
      )
    }

    return (
      <div className={styles.popupAnchor}>
        <EditItemPopOver title={memberType.title} onClose={this.handleEditStop}>
          {content}
        </EditItemPopOver>
      </div>
    )
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.isEditing && !this.props.isEditing) {
      this.domElement.focus()
    }
  }

  setElement = (el: HTMLElement) => {
    this.domElement = el
  }

  render() {
    const {value, type, isEditing} = this.props

    const options = type.options || {}
    const isGrid = options.layout === 'grid'
    const isSortable = options.sortable !== false
    const previewLayout = isGrid ? 'media' : 'default'

    const className = isGrid ? styles.grid : styles.root
    return (
      <div>
        <div
          className={className}
          ref={this.setElement}
        >
          {!isGrid && isSortable && <DragHandle />}

          <div
            className={styles.preview}
            tabIndex={0}
            onClick={this.handleEditStart}
            onKeyPress={this.handleKeyPress}
          >
            {value._transfer ? (
              <UploadPreview
                value={value}
                type={this.getMemberType()}
              />
            ) : (
              <Preview
                layout={previewLayout}
                value={value}
                type={this.getMemberType()}
              />
            )}
          </div>
          <div className={styles.functions}>
            {!type.readOnly && (
              <ConfirmButton
                tabIndex={0}
                kind="simple"
                color="danger"
                icon={TrashIcon}
                title="Delete"
                onClick={this.handleRemove}
              >
                {doConfirm => doConfirm && 'Confirm delete'}
              </ConfirmButton>
            )}
          </div>
        </div>
        {isEditing && this.renderEditItemForm(value)}
      </div>
    )
  }
}
