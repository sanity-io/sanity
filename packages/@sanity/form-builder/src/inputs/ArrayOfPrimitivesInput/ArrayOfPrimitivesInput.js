// @flow
import React from 'react'
import {get} from 'lodash'
import {Item as DefaultItem, List as DefaultList} from 'part:@sanity/components/lists/default'
import {Item as SortableItem, List as SortableList} from 'part:@sanity/components/lists/sortable'
import ArrayFunctions from 'part:@sanity/form-builder/input/array/functions'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {PatchEvent, set, unset} from '../../PatchEvent'
import {startsWith} from '../../utils/pathUtils'
import {resolveTypeName} from '../../utils/resolveTypeName'
import type {Path} from '../../typedefs/path'
import type {Type, Marker} from '../../typedefs'
import type {ItemValue} from '../ArrayInput/typedefs'
import InvalidValue from '../InvalidValueInput'
import styles from './styles/ArrayOfPrimitivesInput.css'
import getEmptyValue from './getEmptyValue'
import Item from './Item'

function move(arr, from, to) {
  const copy = arr.slice()
  const val = copy[from]
  copy.splice(from, 1)
  copy.splice(to, 0, val)
  return copy
}

function insertAt(arr, index, item) {
  const copy = arr.slice()
  copy.splice(index + 1, 0, item)
  return copy
}

type Props = {
  type: Type,
  value: Array<ItemValue>,
  level: number,
  onChange: (event: PatchEvent) => void,
  onFocus: Path => void,
  onBlur: () => void,
  focusPath: Path,
  readOnly: ?boolean,
  markers: Array<Marker>
}

export default class ArrayOfPrimitivesInput extends React.PureComponent<Props> {
  _element: ?Fieldset
  _lastAddedIndex = -1

  set(nextValue: any[]) {
    this._lastAddedIndex = -1
    const patch = nextValue.length === 0 ? unset() : set(nextValue)
    this.props.onChange(PatchEvent.from(patch))
  }

  removeAt(index: number) {
    const {value = []} = this.props
    this.set(value.filter((_, i) => i !== index))
    this.props.onFocus([Math.max(0, index - 1)])
  }

  handleAppend = itemValue => {
    const {value = [], onFocus} = this.props
    this.set(value.concat(itemValue))
    onFocus([value.length])
  }

  handlePrepend = itemValue => {
    const {value = [], onFocus} = this.props
    this.set([itemValue].concat(value))
    onFocus([value.length])
  }

  insertAt(index, type) {
    const {value = [], onFocus} = this.props
    this.set(insertAt(value, index, getEmptyValue(type)))
    onFocus([index + 1])
  }

  handleRemoveItem = (index: number) => {
    this.removeAt(index)
  }

  handleItemChange = event => {
    this._lastAddedIndex = -1
    this.props.onChange(event)
  }

  handleItemEnterKey = index => {
    this.insertAt(index, this.props.type.of[0])
    this._lastAddedIndex = index + 1
  }

  handleItemEscapeKey = index => {
    const {value} = this.props
    if (index === this._lastAddedIndex && value[index] === '') {
      this.removeAt(index)
    }
  }

  handleSortEnd = event => {
    const {value} = this.props
    const {oldIndex, newIndex} = event
    this.set(move(value, oldIndex, newIndex))
  }

  getMemberType(typeName) {
    const {type} = this.props
    return type.of.find(
      memberType => memberType.name === typeName || memberType.jsonType === typeName
    )
  }

  renderItem = (item, index) => {
    const {type, level, markers, value, focusPath, onChange, onFocus, readOnly, onBlur} = this.props

    const typeName = resolveTypeName(item)
    const itemMemberType = this.getMemberType(typeName)

    if (!itemMemberType) {
      return (
        <InvalidValue
          key={index}
          actualType={typeName}
          validTypes={type.of.map(memberType => memberType.name)}
          onChange={ev => onChange(ev.prefixAll(index))}
          value={value}
        />
      )
    }

    const isSortable = get(type, 'options.sortable') !== false
    const ListItem = isSortable ? SortableItem : DefaultItem
    const filteredMarkers = markers.filter(marker => startsWith([index], marker.path))

    return (
      <ListItem key={index} index={index} className={styles.item}>
        <Item
          level={level + 1}
          index={index}
          value={item}
          readOnly={readOnly}
          markers={filteredMarkers}
          isSortable={isSortable}
          type={itemMemberType}
          focusPath={focusPath}
          onFocus={onFocus}
          onBlur={onBlur}
          onEnterKey={this.handleItemEnterKey}
          onEscapeKey={this.handleItemEscapeKey}
          onChange={this.handleItemChange}
          onRemove={this.handleRemoveItem}
        />
      </ListItem>
    )
  }

  renderList(value) {
    const {type} = this.props
    const isSortable = get(type, 'options.sortable') !== false
    return isSortable ? (
      <SortableList
        className={styles.list}
        onSortEnd={this.handleSortEnd}
        movingItemClass={styles.movingItem}
        useDragHandle
      >
        {value.map(this.renderItem)}
      </SortableList>
    ) : (
      <DefaultList decoration="divider">{value.map(this.renderItem)}</DefaultList>
    )
  }

  setElement = (el: ?Fieldset) => {
    this._element = el
  }

  focus() {
    if (this._element) {
      this._element.focus()
    }
  }

  handleFocusItem = index => {
    this.props.onFocus([index])
  }

  render() {
    const {type, value, level, markers, readOnly, onChange, onFocus} = this.props
    return (
      <Fieldset
        legend={type.title}
        description={type.description}
        level={level}
        tabIndex={0}
        onFocus={onFocus}
        ref={this.setElement}
        markers={markers}
      >
        <div className={styles.root}>
          {value && value.length > 0 && <div className={styles.list}>{this.renderList(value)}</div>}
          <div className={styles.functions}>
            <ArrayFunctions
              type={type}
              value={value}
              readOnly={readOnly}
              onAppendItem={this.handleAppend}
              onPrependItem={this.handlePrepend}
              onFocusItem={this.handleFocusItem}
              onCreateValue={getEmptyValue}
              onChange={onChange}
            />
          </div>
        </div>
      </Fieldset>
    )
  }
}
