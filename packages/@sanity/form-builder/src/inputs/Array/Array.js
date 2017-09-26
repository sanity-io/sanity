// @flow
import type {ItemValue, TransferStatus, Type} from './types'
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

import Observable from '@sanity/observable'
import {findMatchingImporter} from './utils'

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

function createProtoValue(type: Type): ItemValue {
  if (type.jsonType !== 'object') {
    throw new Error(`Invalid item type: "${type.type}". Default array input can only contain objects (for now)`)
  }
  const key = randomKey(12)
  return type.name === 'object' ? {_key: key} : {
    _type: type.name,
    _key: key
  }
}
type Props<T> = {
  type: Type,
  value: Array<T>,
  level: number,
  onChange: (event: PatchEvent) => void
}

type State = {
  editItemKey: ?string,
  transferItems: {[string]: TransferStatus}
}

export default class ArrayInput<T: ItemValue> extends React.Component<Props<T>, State> {
  state = {
    editItemKey: null,
    transferItems: {}
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

  handleDropDownAction = (menuItem: {type: Type}) => {
    const item = createProtoValue(menuItem.type)
    this.append(item)
    this.setState({editItemKey: item._key})
  }

  handleAddBtnClick = () => {
    const {type} = this.props
    const memberType = type.of[0]
    if (!memberType) {
      throw new Error('Nothing to add')
    }
    const item = createProtoValue(memberType)
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

  handlePaste = (ev: SyntheticClipboardEvent<*>) => {
    if (ev.clipboardData.files) {
      ev.preventDefault()
      ev.stopPropagation()
      this.importFiles(Array.from(ev.clipboardData.files))
    }
  }

  setTransferStatus(key: string, status: ?TransferStatus) {
    this.setState(prevState => ({
      transferItems: {
        ...prevState.transferItems,
        [key]: status
      }
    }))
  }

  handleDragOver = (ev: SyntheticDragEvent<*>) => {
    ev.preventDefault()
    ev.stopPropagation()
  }

  importFiles(files: Array<File>) {
    const import$ = Observable.from(files)
      .mergeMap(file => {
        const {importer, memberType} = findMatchingImporter(this.props.type, file)
        if (!memberType || !importer) {
          return Observable.of(null)
        }
        const proto = createProtoValue(memberType)
        return importer(file)
          .reduce((prev, curr) => curr)
          .map(result => ({...result, ...proto}))
      })
      .filter(Boolean)

    import$.subscribe(item => {
      this.append(item)
    })
  }

  handleDrop = (ev: SyntheticDragEvent<*>) => {
    const {onChange} = this.props
    if (ev.dataTransfer.files) {
      ev.preventDefault()
      ev.stopPropagation()
      this.importFiles(Array.from(ev.dataTransfer.files))
    }
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
    const {type} = this.props
    const value = this.getValueWithUploadItemsMerged()
    const options = type.options || {}

    const isSortable = options.sortable !== false
    const isGrid = options.layout === 'grid'

    const {List, Item} = resolveListComponents(isSortable, isGrid)

    const listProps = isSortable
      ? {movingItemClass: styles.movingItem, onSort: this.handleSort}
      : {}

    return (
      <List
        {...listProps}
      >
        {value.map((item, index) => {
          const {editItemKey} = this.state
          const itemProps = isSortable ? {index} : {}
          return (
            <Item key={item._key} className={styles.item} {...itemProps}>
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

  getValueWithUploadItemsMerged() : Array<T> {
    const {value} = this.props
    const {transferItems} = this.state
    const keys = Object.keys(transferItems)
    if (keys.length === 0) {
      return value
    }
    return value.map(item => {
      return (transferItems[item._key])
        ? {...item, ...(transferItems[item._key])}
        : item
    })
  }

  render() {
    const {type, level, value} = this.props

    return (
      <Fieldset
        legend={type.title}
        description={type.description}
        level={level}
        tabIndex="0"
        onPaste={this.handlePaste} /* note: the onPaste must be on fieldset for it to work in chrome */
        onDragOver={this.handleDragOver}
        onDrop={this.handleDrop}
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
