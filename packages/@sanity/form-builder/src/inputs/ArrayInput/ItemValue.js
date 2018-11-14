// @flow
/* eslint-disable complexity */

import type {Node} from 'react'
import React from 'react'
import LinkIcon from 'part:@sanity/base/link-icon'

import EditItemFold from 'part:@sanity/components/edititem/fold'
import Popover from 'part:@sanity/components/dialogs/popover'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import ValidationStatus from 'part:@sanity/components/validation/status'

import {createDragHandle} from 'part:@sanity/components/lists/sortable'
import {IntentLink} from 'part:@sanity/base/router'
import DragBarsIcon from 'part:@sanity/base/bars-icon'
import {FormBuilderInput} from '../../FormBuilderInput'
import PatchEvent from '../../PatchEvent'
import Preview from '../../Preview'

import {resolveTypeName} from '../../utils/resolveTypeName'
import type {Path} from '../../typedefs/path'
import type {Marker, Type} from '../../typedefs'
import * as PathUtils from '../../utils/pathUtils'
import ConfirmButton from './ConfirmButton'
import styles from './styles/ItemValue.css'
import type {ArrayType, ItemValue} from './typedefs'
import Ink from 'react-ink'

const DragHandle = createDragHandle(() => (
  <span className={styles.dragHandle}>
    <DragBarsIcon />
  </span>
))

const CLOSE_ACTION = {
  name: 'close',
  title: 'Close'
}

const CANCEL_ACTION = {
  name: 'close',
  title: 'Cancel'
}

const DELETE_ACTION = {
  name: 'delete',
  kind: 'simple',
  title: 'Delete',
  color: 'danger',
  secondary: true
}

type Props = {
  type: ArrayType,
  value: ItemValue,
  level: number,
  markers: Array<Marker>,
  layout?: 'media' | 'default',
  onRemove: ItemValue => void,
  onChange: (PatchEvent, ItemValue) => void,
  onFocus: Path => void,
  onBlur: void => void,
  readOnly: ?boolean,
  focusPath: Path
}

function pathSegmentFrom(value) {
  return {_key: value._key}
}

function hasFocusInPath(path, value) {
  return path.length === 1 && PathUtils.isSegmentEqual(path[0], pathSegmentFrom(value))
}

const IGNORE_KEYS = ['_key', '_type', '_weak']

function isEmpty(value) {
  return Object.keys(value).every(key => IGNORE_KEYS.includes(key))
}

export default class RenderItemValue extends React.Component<Props> {
  _focusArea: ?FocusArea

  static defaultProps = {
    level: 0,
    markers: []
  }

  componentDidMount() {
    const {focusPath, value} = this.props
    if (value._key && hasFocusInPath(focusPath, value)) {
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
    if (isEmpty(this.props.value)) {
      this.handleRemove()
    } else {
      this.setFocus()
    }
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
      // Needs a proper confirm dialog later
      // eslint-disable-next-line no-alert
      if (window.confirm('Do you really want to delete?')) {
        this.handleRemove()
      }
    }
  }

  renderEditItemForm(item: ItemValue): Node {
    const {type, markers, focusPath, onFocus, onBlur, readOnly, filterField} = this.props
    const options = type.options || {}

    const memberType = this.getMemberType() || {}
    const childMarkers = markers.filter(marker => marker.path.length > 1)

    const content = (
      <FormBuilderInput
        type={memberType}
        level={0}
        value={isEmpty(item) ? undefined : item}
        onChange={this.handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        focusPath={focusPath}
        readOnly={readOnly || memberType.readOnly}
        markers={childMarkers}
        path={[{_key: item._key}]}
        filterField={filterField}
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
          <EditItemFold title={`Edit ${memberType.title}`} onClose={this.handleEditStop}>
            {content}
          </EditItemFold>
        </div>
      )
    }

    const dialogSize = 'medium'

    const isItemEmpty = isEmpty(item)
    const actions = [
      isItemEmpty ? CANCEL_ACTION : CLOSE_ACTION,
      !isItemEmpty && !readOnly && DELETE_ACTION
    ].filter(Boolean)

    if (options.editModal === 'popover') {
      return (
        <div className={styles.popupAnchor}>
          <Popover
            title={`Edit ${memberType.title}`}
            onClose={this.handleEditStop}
            onEscape={this.handleEditStop}
            onClickOutside={this.handleEditStop}
            actions={actions}
            onAction={this.handleDialogAction}
          >
            <DialogContent size={dialogSize}>{content}</DialogContent>
          </Popover>
        </div>
      )
    }

    return (
      <DefaultDialog
        onClose={this.handleEditStop}
        key={item._key}
        title={`Edit ${memberType.title}`}
        actions={actions}
        onAction={this.handleDialogAction}
        showCloseButton={false}
      >
        <div className={styles.defaultDialogContent}>
          <DialogContent size={dialogSize}>{content}</DialogContent>
        </div>
      </DefaultDialog>
    )
  }

  renderItem() {
    const {value, markers, type, readOnly} = this.props
    const options = type.options || {}
    const isGrid = options.layout === 'grid'
    const isSortable = !readOnly && !type.readOnly && options.sortable !== false
    const previewLayout = isGrid ? 'media' : 'default'
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    const scopedValidation = validation.map(marker => {
      if (marker.path.length <= 1) {
        return marker
      }

      const level = marker.level === 'error' ? 'errors' : 'warnings'
      return Object.assign({}, marker, {
        item: marker.item.cloneWithMessage(`Contains ${level}`)
      })
    })
    const classNames = [
      errors.length > 0 ? styles.innerWithError : styles.inner,
      !value._key && styles.warning
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={classNames}>
        {!isGrid && isSortable && <DragHandle />}
        <div
          tabIndex={0}
          onClick={value._key && this.handleEditStart}
          onKeyPress={this.handleKeyPress}
          className={styles.previewWrapper}
        >
          <div
            tabIndex={-1}
            ref={this.setFocusArea}
            className={styles.previewWrapperHelper}
            onFocus={this.handleFocus}
          >
            {!value._key && <div className={styles.missingKeyMessage}>Missing key</div>}
            <Preview layout={previewLayout} value={value} type={this.getMemberType()} />
            <Ink duration={1000} opacity={0.1} radius={200} />
          </div>
        </div>

        <div className={isGrid ? styles.functionsInGrid : styles.functions}>
          <div className={styles.validationStatus}>
            <ValidationStatus markers={scopedValidation} />
          </div>
          {value._ref && (
            <IntentLink className={styles.linkToReference} intent="edit" params={{id: value._ref}}>
              <LinkIcon />
            </IntentLink>
          )}
          {!readOnly && <ConfirmButton title="Remove this item" onConfirm={this.handleRemove} />}
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
      <div className={isGrid ? styles.gridItem : styles.listItem}>
        {this.renderItem()}
        {isExpanded && this.renderEditItemForm(value)}
      </div>
    )
  }
}
