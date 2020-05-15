import React from 'react'
import {get} from 'lodash'
import {Item as DefaultItem, List as DefaultList} from 'part:@sanity/components/lists/default'
import {Item as SortableItem, List as SortableList} from 'part:@sanity/components/lists/sortable'
import ArrayFunctions from 'part:@sanity/form-builder/input/array/functions'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {PatchEvent, set, unset} from '../../PatchEvent'
import {startsWith} from '@sanity/util/paths'
import {resolveTypeName} from '../../utils/resolveTypeName'
import {Path} from '../../typedefs/path'
import {Marker, Type} from '../../typedefs'
import InvalidValue from '../InvalidValueInput'
import styles from './styles/ArrayOfPrimitivesInput.css'
import getEmptyValue from './getEmptyValue'
import Item from './Item'

const NO_MARKERS: Marker[] = []

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
  type: Type
  value: Array<string | number | boolean>
  level: number
  onChange: (event: PatchEvent) => void
  onFocus: (arg0: Path) => void
  onBlur: () => void
  focusPath: Path
  readOnly: boolean | null
  markers: Array<Marker>
  presence: any
}
export default class ArrayOfPrimitivesInput extends React.PureComponent<Props> {
  _element: Fieldset | null
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
    const {
      type,
      level,
      markers,
      value,
      focusPath,
      onChange,
      onFocus,
      readOnly,
      onBlur,
      presence
    } = this.props
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
    const childPresence = presence.filter(pItem => startsWith([index], pItem.path))
    return (
      <ListItem key={index} index={index} className={styles.item}>
        <Item
          level={level + 1}
          index={index}
          value={item}
          readOnly={readOnly}
          markers={filteredMarkers.length === 0 ? NO_MARKERS : filteredMarkers}
          isSortable={isSortable}
          type={itemMemberType}
          focusPath={focusPath}
          onFocus={onFocus}
          onBlur={onBlur}
          onEnterKey={this.handleItemEnterKey}
          onEscapeKey={this.handleItemEscapeKey}
          onChange={this.handleItemChange}
          onRemove={this.handleRemoveItem}
          presence={childPresence}
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

  setElement = (el: Fieldset | null) => {
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
    const {type, value, level, markers, readOnly, onChange, onFocus, presence} = this.props
    return (
      <Fieldset
        legend={type.title}
        description={type.description}
        level={level}
        tabIndex={0}
        onFocus={onFocus}
        ref={this.setElement}
        markers={markers}
        presence={presence.filter(item => item.path[0] === '$' || item.path.length === 0)}
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
