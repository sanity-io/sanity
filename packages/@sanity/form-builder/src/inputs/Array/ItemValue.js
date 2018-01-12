// @flow
import type {ArrayType, ItemValue} from './typedefs'

import type {Node} from 'react'
import React from 'react'
import styles from './styles/ItemValue.css'
import ConfirmButton from './ConfirmButton'
import LinkIcon from 'part:@sanity/base/link-icon'

import EditItemFold from 'part:@sanity/components/edititem/fold'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import DefaultDialog from 'part:@sanity/components/dialogs/default'

import {FormBuilderInput} from '../../FormBuilderInput'
import PatchEvent from '../../PatchEvent'
import Preview from '../../Preview'

import {createDragHandle} from 'part:@sanity/components/lists/sortable'
import {IntentLink} from 'part:@sanity/base/router'
import {resolveTypeName} from '../../utils/resolveTypeName'
import type {Path} from '../../typedefs/path'
import type {Type} from '../../typedefs'
import * as PathUtils from '../../utils/pathUtils'
import DragBarsIcon from 'part:@sanity/base/bars-icon'

const DragHandle = createDragHandle(() => <span className={styles.dragHandle}><DragBarsIcon /></span>)

type Props = {
  type: ArrayType,
  value: ItemValue,
  level: number,
  layout?: 'media' | 'default',
  onRemove: (ItemValue) => void,
  onChange: (PatchEvent, ItemValue) => void,
  onFocus: (Path) => void,
  onBlur: void => void,
  focusPath: Path
}

function pathSegmentFrom(value) {
  return {_key: value._key}
}

function hasFocusInPath(path, value) {
  return path.length === 1 && PathUtils.isSegmentEqual(path[0], pathSegmentFrom(value))
}

export default class RenderItemValue extends React.Component<Props> {

  _focusArea: ?FocusArea

  static defaultProps = {
    level: 0
  }

  componentDidMount() {
    const {focusPath, value} = this.props
    if (hasFocusInPath(focusPath, value)) {
      this.focus()
    }
  }

  componentDidUpdate(prevProps) {
    const hadFocus = hasFocusInPath(prevProps.focusPath, prevProps.value)
    const hasFocus = hasFocusInPath(this.props.focusPath, this.props.value)
    if (!hadFocus && hasFocus) {
      this.focus()
    }
  }

  handleEditStart = event => {
    this.setFocus([PathUtils.FOCUS_TERMINATOR])
  }

  handleFocus = () => {
    this.setFocus()
  }

  handleEditStop = () => {
    this.setFocus()
  }

  handleKeyPress = (event: SyntheticKeyboardEvent<*>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.setFocus([PathUtils.FOCUS_TERMINATOR])
    }
  }

  handleRemove = () => {
    const {onRemove, value} = this.props
    onRemove(value)
  }

  handleChange = (event: PatchEvent) => {
    const {onChange, value} = this.props
    onChange(event, value)
  }

  getMemberType(): ?Type {
    const {value, type} = this.props
    const itemTypeName = resolveTypeName(value)
    return type.of.find(memberType => memberType.name === itemTypeName)
  }

  setFocus(path: Path = []) {
    const {value, onFocus} = this.props
    onFocus([{_key: value._key}, ...path])
  }

  focus() {
    if (this._focusArea) {
      this._focusArea.focus()
    }
  }

  setFocusArea = (el: ?FocusArea) => {
    this._focusArea = el
  }

  handleDialogAction = action => {
    if (action.name === 'close') {
      this.handleEditStop()
    }
    if (action.name === 'delete') {
      if (window.confirm("Do you really want to delete?")) {
        this.handleRemove()
      }
    }
  }

  renderEditItemForm(item: ItemValue): Node {
    const {type, focusPath, onFocus, onBlur} = this.props
    const options = type.options || {}

    const memberType = this.getMemberType() || {}

    // Reset level if a full screen modal
    const level = options.editModal === 'fullscreen' ? 0 : 2

    const content = (
      <FormBuilderInput
        type={memberType}
        level={1}
        value={item}
        onChange={this.handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        focusPath={focusPath}
        path={[{_key: item._key}]}
      />
    )

    // test focus issues by uncommenting the next line
    // return content

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

    if (options.editModal === 'popover') {
      return (
        <div className={styles.popupAnchor}>
          <EditItemPopOver onClose={this.handleEditStop} key={item._key}>
            {content}
          </EditItemPopOver>
        </div>
      )
    }

    return (
      <div className={styles.popupAnchor}>
        <DefaultDialog
          isOpen
          onClose={this.handleEditStop}
          key={item._key}
          title="Edit"
          onAction={this.handleDialogAction}
          actions={[{
            index: '1',
            name: 'close',
            title: 'Close'
          },
          {
            index: '2',
            name: 'delete',
            kind: 'simple',
            title: 'Delete',
            color: 'danger'
          }
          ]}
        >
          <div className={styles.defaultDialogContent}>
            {content}
          </div>
        </DefaultDialog>
      </div>
    )
  }

  renderItem() {
    const {value, type} = this.props
    const options = type.options || {}
    const isGrid = options.layout === 'grid'
    const isSortable = options.sortable !== false
    const previewLayout = isGrid ? 'media' : 'default'

    return (
      <div className={styles.inner}>
        {!isGrid && isSortable && <DragHandle />}
        <div
          tabIndex={0}
          onClick={this.handleEditStart}
          onKeyPress={this.handleKeyPress}
          onFocus={this.handleFocus}
          ref={this.setFocusArea}
          className={styles.previewWrapper}
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
            <ConfirmButton
              title="Remove this item"
              onConfirm={this.handleRemove}
            />
          )}
        </div>
      </div>
    )
  }

  render() {
    const {value, focusPath, type} = this.props

    const options = type.options || {}
    const isGrid = options.layout === 'grid'
    const isExpanded = PathUtils.isExpanded(value, focusPath)

    return (
      <div
        className={isGrid ? styles.gridItem : styles.listItem}
        ref={this.setElement}
      >
        {this.renderItem()}
        <div
          className={options.editModal === 'fold' ? styles.editRootFold : styles.editRoot}
        >
          {isExpanded && this.renderEditItemForm(value)}
        </div>
      </div>
    )
  }
}
