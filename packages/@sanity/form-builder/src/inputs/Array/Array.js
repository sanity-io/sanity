// @flow
import type {ArrayType, ItemValue} from './typedefs'
import React from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import Button from 'part:@sanity/components/buttons/default'
import RenderItemValue from './ItemValue'
import styles from './styles/Array.css'
import randomKey from './randomKey'
import PatchEvent, {insert, set, setIfMissing, unset} from '../../PatchEvent'
import resolveListComponents from './resolveListComponents'
import {resolveTypeName} from '../../utils/resolveTypeName'
import type {Uploader} from '../../sanity/uploads/typedefs'
import type {Type, Marker} from '../../typedefs'
import type {Path} from '../../typedefs/path'
import {FOCUS_TERMINATOR, startsWith, isEqual as isEqualPath} from '../../utils/pathUtils'
import type {Subscription} from '../../typedefs/observable'
import UploadTargetFieldset from '../../utils/UploadTargetFieldset'

function createProtoValue(type: Type): ItemValue {
  if (type.jsonType !== 'object') {
    throw new Error(
      `Invalid item type: "${type.type}". Default array input can only contain objects (for now)`
    )
  }
  const key = randomKey(12)
  return type.name === 'object'
    ? {_key: key}
    : {
        _type: type.name,
        _key: key
      }
}

type Props = {
  type: ArrayType,
  value: Array<ItemValue>,
  markers: Array<Marker>,
  level: number,
  onChange: (event: PatchEvent) => void,
  onFocus: Path => void,
  onBlur: () => void,
  focusPath: Path,
  readOnly: ?boolean,
  resolveUploader?: (type: Type, file: File) => Uploader
}

export default class ArrayInput extends React.Component<Props, State> {
  _element: ?UploadTargetFieldset

  uploadSubscriptions: {[string]: Subscription}
  uploadSubscriptions = {}

  static defaultProps = {
    focusPath: []
  }
  state = {
    isMoving: false
  }

  insert(itemValue: ItemValue, position: 'before' | 'after', atIndex: number) {
    const {onChange} = this.props
    onChange(PatchEvent.from(setIfMissing([]), insert([itemValue], position, [atIndex])))
  }

  prepend(value: ItemValue) {
    this.insert(value, 'before', 0)
  }

  append(value: ItemValue) {
    this.insert(value, 'after', -1)
  }

  handleRemoveItem = (item: ItemValue) => {
    this.removeItem(item)
  }

  handleFocus = () => {
    this.props.onFocus([FOCUS_TERMINATOR])
  }

  setItemExpanded(item: ItemValue) {
    this.props.onFocus([{_key: item._key}, FOCUS_TERMINATOR])
  }

  handleDropDownAction = (menuItem: {type: Type}) => {
    const item = createProtoValue(menuItem.type)
    this.append(item)
    this.setItemExpanded(item)
  }

  handleAddBtnClick = () => {
    const {type} = this.props
    const memberType = type.of[0]
    if (!memberType) {
      throw new Error('Nothing to add')
    }
    const item = createProtoValue(memberType)
    this.setItemExpanded(item)
    this.append(item)
  }

  removeItem(item: ItemValue) {
    const {onChange, onFocus, value} = this.props
    onChange(PatchEvent.from(unset(item._key ? [{_key: item._key}] : [value.indexOf(item)])))

    if (item._key in this.uploadSubscriptions) {
      this.uploadSubscriptions[item._key].unsubscribe()
    }

    const idx = value.indexOf(item)
    const nextItem = value[idx + 1] || value[idx - 1]
    onFocus([nextItem ? {_key: nextItem._key} : FOCUS_TERMINATOR])
  }

  renderSelectType() {
    const {type} = this.props

    const items = type.of.map((memberDef, i) => {
      return {
        title: memberDef.title || memberDef.type.name,
        type: memberDef
      }
    })

    return (
      <DropDownButton items={items} onAction={this.handleDropDownAction}>
        Add
      </DropDownButton>
    )
  }

  handleItemChange = (event: PatchEvent, item: ItemValue) => {
    const {onChange, value} = this.props

    const memberType = this.getMemberTypeOfItem(item)
    if (!memberType) {
      // eslint-disable-next-line no-console
      console.log('Could not find member type of item ', item)
      return
    }
    if (memberType.readOnly) {
      return
    }

    const key = item._key || randomKey(12)
    onChange(
      event.prefixAll({_key: key}).prepend(item._key ? [] : set(key, [value.indexOf(item), '_key']))
    )
  }

  handleSortStart = () => {
    this.setState({isMoving: true})
  }

  handleSortEnd = (event: {newIndex: number, oldIndex: number}) => {
    this.setState({isMoving: false})
    const {value, onChange} = this.props
    const item = value[event.oldIndex]
    const refItem = value[event.newIndex]

    // console.log('from %d => %d', event.oldIndex, event.newIndex, event)
    if (!item._key || !refItem._key) {
      // eslint-disable-next-line no-console
      console.error(
        'Neither the item you are moving nor the item you are moving to have a key. Cannot continue.'
      )
      return
    }

    if (event.oldIndex === event.newIndex || item._key === refItem._key) {
      return
    }

    onChange(
      PatchEvent.from(
        unset([{_key: item._key}]),
        insert([item], event.oldIndex > event.newIndex ? 'before' : 'after', [{_key: refItem._key}])
      )
    )
  }

  getExpandedItem(): ?ItemValue {
    const {focusPath, value} = this.props
    const [head] = focusPath || []
    return head && value.find(item => item._key === head._key)
  }

  getMemberTypeOfItem(item: ItemValue): ?Type {
    const {type} = this.props
    const itemTypeName = resolveTypeName(item)
    return type.of.find(memberType => memberType.name === itemTypeName)
  }

  renderList = () => {
    const {type, markers, readOnly, value, focusPath, onBlur, onFocus, level} = this.props
    const {isMoving} = this.state
    const options = type.options || {}

    const isSortable = options.sortable !== false

    const isGrid = options.layout === 'grid'

    const {List, Item} = resolveListComponents(isSortable, isGrid)

    const listProps = isSortable
      ? {
          movingItemClass: styles.movingItem,
          onSortEnd: this.handleSortEnd,
          onSortStart: this.handleSortStart,
          lockToContainerEdges: true,
          useDragHandle: !isGrid
        }
      : {}
    const listItemClassName = isMoving ? styles.listItemMute : styles.listItem
    return (
      <List className={readOnly ? styles.listReadOnly : styles.list} {...listProps}>
        {value.map((item, index) => {
          const isChildMarker = marker =>
            startsWith([index], marker.path) || startsWith([{_key: item && item._key}], marker.path)

          const itemProps = isSortable ? {index} : {}
          return (
            <Item
              key={item._key}
              className={isGrid ? styles.gridItem : listItemClassName}
              {...itemProps}
            >
              <RenderItemValue
                type={type}
                value={item}
                level={level}
                markers={markers.filter(isChildMarker)}
                onRemove={this.handleRemoveItem}
                onChange={this.handleItemChange}
                focusPath={focusPath}
                onFocus={onFocus}
                readOnly={readOnly}
                onBlur={onBlur}
              />
            </Item>
          )
        })}
      </List>
    )
  }

  focus() {
    if (this._element) {
      this._element.focus()
    }
  }

  setElement = (el: ?UploadTargetFieldset) => {
    this._element = el
  }

  getUploadOptions = (file: File): Array<UploadOption> => {
    const {type, resolveUploader} = this.props
    if (!resolveUploader) {
      return []
    }
    return type.of
      .map(memberType => {
        const uploader = resolveUploader(memberType, file)
        return (
          uploader && {
            type: memberType,
            uploader
          }
        )
      })
      .filter(Boolean)
  }

  handleUpload = ({file, type, uploader}) => {
    const {onChange} = this.props
    const item = createProtoValue(type)

    const key = item._key
    this.append(item)

    const events$ = uploader
      .upload(file, type)
      .map(uploadEvent => PatchEvent.from(uploadEvent.patches).prefixAll({_key: key}))

    this.uploadSubscriptions = {
      ...this.uploadSubscriptions,
      [key]: events$.subscribe(onChange)
    }
  }

  render() {
    const {type, level, readOnly, value} = this.props

    return (
      <UploadTargetFieldset
        markers={this.props.markers}
        tabIndex={0}
        legend={type.title}
        description={type.description}
        level={level}
        className={styles.root}
        onUpload={this.handleUpload}
        onFocus={this.handleFocus}
        type={type}
        getUploadOptions={this.getUploadOptions}
        ref={this.setElement}
      >
        {value && value.length > 0 && this.renderList()}
        {!readOnly && (
          <div className={styles.functions}>
            {this.props.type.of.length === 1 && (
              <Button onClick={this.handleAddBtnClick} className={styles.addButton}>
                Add
              </Button>
            )}
            {this.props.type.of.length > 1 && this.renderSelectType()}
          </div>
        )}
      </UploadTargetFieldset>
    )
  }
}
