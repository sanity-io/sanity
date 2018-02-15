// @flow
import React from 'react'
import {get} from 'lodash'
import {Item as DefaultItem, List as DefaultList} from 'part:@sanity/components/lists/default'
import {Item as SortableItem, List as SortableList} from 'part:@sanity/components/lists/sortable'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import Button from 'part:@sanity/components/buttons/default'
import Item from './Item'
import styles from './styles/ArrayOfPrimitives.css'
import PatchEvent, {set, unset} from '../../PatchEvent'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import getEmptyValue from './getEmptyValue'

import {resolveTypeName} from '../../utils/resolveTypeName'
import InvalidValue from '../InvalidValue'
import type {ItemValue} from '../Array/typedefs'
import type {Path} from '../../typedefs/path'
import type {Type} from '../../typedefs'

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
  focusPath: Path
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

  append(type) {
    const {value = [], onFocus} = this.props
    this.set(value.concat(getEmptyValue(type)))
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

  handleDropDownAction = action => {
    this.append(action.type)
  }

  handleAddBtnClick = () => {
    this.append(this.props.type.of[0])
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
    return type.of.find(memberType => memberType.name === typeName)
  }

  renderItem = (item, index) => {
    const {type, level, value, focusPath, onChange, onFocus, readOnly, onBlur} = this.props

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
    return (
      <ListItem key={index} index={index} className={styles.item}>
        <Item
          level={level + 1}
          index={index}
          value={item}
          readOnly={readOnly}
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
    return isSortable
      ? (
        <SortableList
          className={styles.list}
          onSortEnd={this.handleSortEnd}
          movingItemClass={styles.movingItem}
          useDragHandle
        >
          {value.map(this.renderItem)}
        </SortableList>
      )
      : (
        <DefaultList decoration="divider">
          {value.map(this.renderItem)}
        </DefaultList>
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

  renderSelectType() {
    const {type} = this.props

    const items = type.of.map(memberDef => ({
      title: memberDef.title || memberDef.type.name,
      type: memberDef
    }))

    return (
      <DropDownButton items={items} onAction={this.handleDropDownAction}>
        New {this.props.type.title}
      </DropDownButton>
    )
  }

  render() {
    const {type, value, level, readOnly, onFocus} = this.props
    return (
      <Fieldset
        legend={type.title}
        description={type.description}
        level={level}
        tabIndex={0}
        onFocus={onFocus}
        ref={this.setElement}
      >
        <div className={styles.root}>
          <div className={styles.list}>
            {value && value.length > 0 && this.renderList(value)}
          </div>
          {!readOnly && (
            <div className={styles.functions}>
              {type.of.length === 1 ? (
                <Button onClick={this.handleAddBtnClick} className={styles.addButton}>
                  Add
                </Button>
              ) : this.renderSelectType()}
            </div>
          )}
        </div>
      </Fieldset>
    )
  }
}
