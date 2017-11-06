// @flow
import type {ItemValue, ArrayType} from './typedefs'

import React from 'react'
import type {Node} from 'react'
import styles from './styles/ItemValue.css'
import ConfirmButton from './ConfirmButton'
import LinkIcon from 'part:@sanity/base/link-icon'
import Button from 'part:@sanity/components/buttons/default'
import TrashIcon from 'part:@sanity/base/trash-icon'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import PopOver from 'part:@sanity/components/dialogs/popover'

import ItemForm from './ItemForm'
import MemberValue from '../../Member'
import PatchEvent from '../../PatchEvent'
import Preview from '../../Preview'

import {DragHandle} from 'part:@sanity/components/lists/sortable'
import {IntentLink} from 'part:@sanity/base/router'
import {resolveTypeName} from '../../utils/resolveTypeName'

type Props = {
  type: ArrayType,
  value: ItemValue,
  level: number,
  layout: 'media' | 'default',
  onRemove: (ItemValue) => void,
  onChange: (PatchEvent, ItemValue) => void,
  onEditStart: (ItemValue) => void,
  onEditStop: (ItemValue) => void,
  isEditing: boolean
}

export default class Item extends React.Component<Props> {

  domElement: ?HTMLElement

  state = {
    showConfirmDialog: false
  }

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

  handleKeyPress = (event: SyntheticKeyboardEvent<*>) => {
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

  renderEditItemForm(item: ItemValue): Node {
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
        <EditItemPopOver onClose={this.handleEditStop} key={item._key}>
          {content}
        </EditItemPopOver>
      </div>
    )
  }

  componentDidUpdate(prevProps: Props) {
    if (this.domElement && prevProps.isEditing && !this.props.isEditing) {
      this.domElement.focus()
    }
  }

  setElement = (el: ?HTMLElement) => {
    this.domElement = el
  }

  handleDeleteButtonClick = event => {
    this.setState({
      showConfirmDialog: true
    })
  }

  handleConfirmDialogClose = event => {
    this.setState({
      showConfirmDialog: false
    })
  }

  render() {
    const {value, type, isEditing} = this.props

    const options = type.options || {}
    const isGrid = options.layout === 'grid'
    const isSortable = options.sortable !== false
    const previewLayout = isGrid ? 'media' : 'default'

    return (
      <div
        className={isGrid ? styles.gridItem : styles.listItem}
        ref={this.setElement}
      >
        <div className={styles.inner}>
          {!isGrid && isSortable && <DragHandle className={styles.dragHandle} />}

          <div
            className={styles.preview}
            tabIndex={0}
            onClick={this.handleEditStart}
            onKeyPress={this.handleKeyPress}
          >
            <Preview
              layout={previewLayout}
              value={value}
              type={this.getMemberType()}
            />
          </div>

          <div className={styles.functions}>
            {
              value._ref && (
                <IntentLink
                  className={styles.linkToReference}
                  intent="edit"
                  params={{id: value._ref}}
                >
                  <LinkIcon />
                </IntentLink>
              )
            }
            {!type.readOnly && (
              <Button
                tabIndex={0}
                kind="simple"
                color="danger"
                icon={TrashIcon}
                title="Delete"
                onClick={this.handleDeleteButtonClick}
              >
                <div className={styles.popoverAnchor}>
                  {
                    this.state.showConfirmDialog && (
                      <PopOver
                        color="danger"
                        useOverlay={false}
                        onClose={this.handleConfirmDialogClose}
                      >
                        <Button
                          kind="simple"
                          onClick={this.handleRemove}
                          icon={TrashIcon}
                        >
                          Confirm delete
                        </Button>
                      </PopOver>
                    )
                  }
                </div>
              </Button>
            )}
          </div>
        </div>
        <div
          className={options.editModal === 'fold' ? styles.editRootFold : styles.editRoot}
        >
          {isEditing && this.renderEditItemForm(value)}
        </div>
      </div>
    )
  }
}
