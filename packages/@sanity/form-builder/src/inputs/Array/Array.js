// @flow
import type {ItemValue, Type} from './types'
import React from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import Button from 'part:@sanity/components/buttons/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import RenderItemValue from './ItemValue'
import styles from './styles/Array.css'
import randomKey from './randomKey'
import PatchEvent, {insert, setIfMissing, unset, set} from '../../PatchEvent'
import resolveListComponents from './resolveListComponents'
import {resolveTypeName} from '../../utils/resolveTypeName'

function hasKeys(object, exclude = []) {
  for (const key in object) {
    if (!exclude.includes(key)) {
      return true
    }
  }
  return false
}

function isEmpty(value: ?ItemValue) {
  return value === undefined || !hasKeys(value, ['_key', '_type', 'index'])
}

type State = {
  selectType: boolean,
  editItemKey: ?string,
  focusItemKey: ?string
}

function createProtoValue(type): ItemValue {
  if (type.jsonType !== 'object') {
    throw new Error(`Invalid item type: "${type.type}". Default array input can only contain objects (for now)`)
  }
  return type.name === 'object' ? {_key: randomKey(12)} : {
    _type: type.name,
    _key: randomKey(12)
  }
}

export default class ArrayInput<T: ItemValue> extends React.Component<*, *, State> {
  props: {
    type: Type,
    value: Array<T>,
    level: number,
    onChange: (event: PatchEvent) => void
  }

  state = {
    selectType: false,
    editItemKey: null,
    focusItemKey: null
  }

  handleAddBtnClick = () => {
    const {type} = this.props
    if (type.of.length > 1) {
      this.setState({selectType: true})
      return
    }

    const item = createProtoValue(type.of[0])

    this.append(item)

    this.setState({
      selectType: false,
      editItemKey: item._key
    })
  }

  insert(itemValue: ItemValue, position: 'before' | 'after', atIndex: number) {
    const {onChange} = this.props
    onChange(PatchEvent.from(
      setIfMissing([]),
      insert([itemValue], position, [atIndex])
    ))
  }

  prepend(value: ItemValue) {
    this.insert(value, 'before', 0)
  }

  append(value: ItemValue) {
    this.insert(value, 'after', -1)
  }

  handleRemoveItem = (item: T) => {
    this.removeItem(item)
  }

  handleItemEditStop = (item: T) => {
    const itemValue = this.getEditItem()
    if (itemValue && isEmpty(itemValue)) {
      this.removeItem(itemValue)
    }
    this.setState({editItemKey: null})
  }

  handleItemEditStart = (item: T) => {
    this.setState({editItemKey: item._key})
  }

  handleDropDownAction = (menuItem: { type: Type }) => {
    const item = createProtoValue(menuItem.type)
    this.append(item)
    this.setState({editItemKey: item._key})
  }

  removeItem(item: T) {
    const {onChange, value} = this.props
    if (item._key === this.state.editItemKey) {
      this.setState({editItemKey: null})
    }
    onChange(
      PatchEvent.from(
        unset(item._key ? [{_key: item._key}] : [value.indexOf(item)])
      )
    )
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
      <DropDownButton items={items} color="primary" onAction={this.handleDropDownAction}>
        New {this.props.type.title}
      </DropDownButton>
    )
  }

  handleItemChange = (event: PatchEvent, item: T) => {
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
      event
        .prefixAll({_key: key})
        .prepend(item._key ? [] : set(key, [value.indexOf(item), '_key']))
    )
  }

  handleSort = (event: { newIndex: number, oldIndex: number }) => {
    const {value, onChange} = this.props
    const item = value[event.oldIndex]
    const refItem = value[event.newIndex]

    // console.log('from %d => %d', event.oldIndex, event.newIndex, event)
    if (!item._key || !refItem._key) {
      // eslint-disable-next-line no-console
      console.error('Neither the item you are moving nor the item you are moving to have a key. Cannot continue.')
      return
    }

    if (event.oldIndex === event.newIndex || item._key === refItem._key) {
      return
    }

    onChange(PatchEvent.from(
      unset([{_key: item._key}]),
      insert(
        [item],
        event.oldIndex > event.newIndex ? 'before' : 'after',
        [{_key: refItem._key}]
      )
    ))
  }

  getEditItem(): ? T {
    const {editItemKey} = this.state
    const {value} = this.props
    return typeof editItemKey === 'number'
      ? value[editItemKey]
      : value.find(item => item._key === editItemKey)
  }

  getMemberTypeOfItem(item: T): ? Type {
    const {type} = this.props
    const itemTypeName = resolveTypeName(item)
    return type.of.find(memberType => memberType.name === itemTypeName)
  }

  renderList() {
    const {type, value} = this.props

    const {List, Item} = resolveListComponents(type)

    return (
      <List
        movingItemClass={styles.movingItem}
        onSort={this.handleSort}
      >
        {value.map((item, index) => {
          const {editItemKey} = this.state
          return (
            <Item key={item._key} index={index} className={styles.item}>
              <RenderItemValue
                type={type}
                value={item}
                onRemove={this.handleRemoveItem}
                onChange={this.handleItemChange}
                onEditStart={this.handleItemEditStart}
                onEditStop={this.handleItemEditStop}
                isEditing={editItemKey === item._key}
              />
            </Item>
          )
        })}
      </List>
    )
  }

  render() {
    const {type, level, value} = this.props
    return (
      <Fieldset
        legend={type.title}
        description={type.description}
        level={level}
        tabIndex="0"
      >
        <div className={styles.root}>
          {
            value && value.length > 0 && (
              <div className={styles.list}>
                {this.renderList()}
              </div>
            )
          }
          {!type.readOnly && (
            <div className={styles.functions}>
              {this.props.type.of.length === 1 && (
                <Button onClick={this.handleAddBtnClick} className={styles.addButton}>
                  Add
                </Button>
              )}
              {this.props.type.of.length > 1 && this.renderSelectType()}
            </div>
          )}
        </div>
      </Fieldset>
    )
  }
}
