//@flow weak
import React, {PropTypes} from 'react'
import {get} from 'lodash'
import humanizeList from 'humanize-list'

import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import Button from 'part:@sanity/components/buttons/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import DefaultList from 'part:@sanity/components/lists/default'
import GridList from 'part:@sanity/components/lists/grid'

import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import ItemForm from './ItemForm'
import ItemPreview from './ItemPreview'
import styles from './styles/Array.css'
import randomKey from './randomKey'
import PatchEvent, {insert, setIfMissing, unset, set} from '../../PatchEvent'
import MemberValue from '../../Member'

function hasKeys(object, exclude = []) {
  for (const key in object) {
    if (!exclude.includes(key)) {
      return true
    }
  }
  return false
}

function isEmpty(value) {
  return value === undefined || !hasKeys(value, ['_key', '_type', 'index'])
}

function createProtoValue(type) {
  if (type.jsonType !== 'object') {
    throw new Error(`Invalid item type: "${type.type}". Default array input can only contain objects (for now)`)
  }
  return {
    _type: type.name,
    _key: randomKey(12)
  }
}

export default class ArrayInput extends React.Component {
  static displayName = 'Array';

  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.array,
    level: PropTypes.number,
    onChange: PropTypes.func
  }

  static defaultProps = {
    onChange() {}
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  state = {
    addItemField: null,
    editItemKey: null,
    lastEditedItem: null
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

  insert(itemValue, position, atIndex) {
    const {onChange} = this.props
    onChange(PatchEvent.from(
      setIfMissing([]),
      insert([itemValue], position, [atIndex])
    ))
  }

  prepend(value) {
    this.insert(value, 'before', 0)
  }

  append(value) {
    this.insert(value, 'after', -1)
  }

  handleRemoveItem = item => {
    this.removeItem(item)
  }

  handleClose = () => {
    const itemValue = this.getEditItem()
    if (isEmpty(itemValue)) {
      this.handleRemoveItem(itemValue)
    }
    this.setState({
      editItemKey: null,
      lastEditedItem: itemValue
    })
  }

  handleDropDownAction = menuItem => {
    const item = createProtoValue(menuItem.type)
    this.setState({editItemKey: item._key})
    this.append(item)
  }

  removeItem(item) {
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
        index: `action${i}`,
        type: memberDef
      }
    })

    return (
      <DropDownButton items={items} color="primary" onAction={this.handleDropDownAction}>
        New {this.props.type.title}
      </DropDownButton>
    )
  }

  handleItemChange = (event : PatchEvent, item) => {
    const {onChange, value} = this.props

    const key = item._key || randomKey(12)
    onChange(
      event
        .prefixAll({_key: key})
        .prepend(item._key ? [] : set(key, [value.indexOf(item), '_key']))
    )
  }

  handleItemEdit = item => {
    this.setState({
      editItem: item,
      editItemKey: item._key || this.props.value.indexOf(item)
    })
  }

  handleMove = event => {
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

  handleItemEnter = () => {
    this.setState({editItemKey: null})
  }

  renderEditItemForm(item) {
    const {type} = this.props
    const itemField = this.getItemType(item)

    // Reset level if a full screen modal
    const level = (type.options && type.options.editModal == 'fullscreen') ? 0 : this.props.level + 1

    const content = (
      <MemberValue path={{_key: item._key}}>
        <ItemForm
          focus
          itemKey={item._key || this.props.value.indexOf(item)}
          type={itemField}
          level={level}
          value={item}
          onChange={this.handleItemChange}
          onEnter={this.handleItemEnter}
          onRemove={this.handleRemoveItem}
        />
      </MemberValue>
    )

    if (type.options && type.options.editModal == 'fullscreen') {
      return (
        <FullscreenDialog title={itemField.title} onClose={this.handleClose} isOpen>
          {content}
        </FullscreenDialog>
      )
    }

    if (type.options && type.options.editModal == 'fold') {
      return (
        <EditItemFold title={itemField.title} onClose={this.handleClose}>
          {content}
        </EditItemFold>
      )
    }

    return (
      <EditItemPopOver title={itemField.title} onClose={this.handleClose}>
        {content}
      </EditItemPopOver>
    )
  }

  getEditItem() {
    const {editItemKey} = this.state
    const {value} = this.props
    return typeof editItemKey === 'number'
    ? value[editItemKey]
    : value.find(item => item._key === editItemKey)
  }

  getItemType(item) {
    const {type} = this.props
    return type.of.find(memberType => memberType.name === item._type)
  }

  handleRemoveInvalidItem = event => {
    const index = Number(event.target.getAttribute('data-item-index'))
    this.props.onChange(PatchEvent.from(unset([index])))
    this.setState({editItemKey: null})
  }

  renderItem = (item, index) => {
    const {type} = this.props
    const itemType = this.getItemType(item)

    if (!itemType) {
      return (
        <div className={styles.warning}>
          <h3>Warning</h3>
          <div>Array item has an invalid type: <pre>{item._type}</pre></div>
          <div>The only allowed item types are: <pre>{humanizeList(type.of.map(ofType => ofType.name))}</pre></div>
          <Button type="button" data-item-index={item._key} onMouseUp={this.handleRemoveInvalidItem}>Remove</Button>
        </div>
      )
    }

    const layout = type.options && type.options.layout == 'grid' ? 'media' : 'default'

    const isRelative = type.options && type.options.editModal == 'fold'

    return (
      <div style={{position: 'relative'}}>
        <ItemPreview
          type={itemType}
          value={item}
          layout={layout}
          onRemove={this.handleRemoveItem}
        />
        <div className={isRelative ? styles.popupAnchorRelative : styles.popupAnchor}>
          {this.getEditItem() === item && this.renderEditItemForm(item)}
        </div>
      </div>
    )
  }

  renderList() {
    const {value, type} = this.props
    const sortable = get(type, 'options.sortable') !== false

    if (type.options && type.options.layout == 'grid') {
      return (
        <GridList
          renderItem={this.renderItem}
          items={value}
          onSelect={this.handleItemEdit}
          onSortEnd={this.handleMove}
          focusedItem={this.state.lastEditedItem}
          sortable={sortable}
        />
      )
    }

    return (
      <DefaultList
        items={value}
        renderItem={this.renderItem}
        onSelect={this.handleItemEdit}
        sortable={sortable}
        onSortEnd={this.handleMove}
        useDragHandle
        decoration="divider"
        focusedItem={this.state.lastEditedItem}
      />
    )
  }

  render() {
    const {type, level, value} = this.props

    return (
      <Fieldset legend={type.title} description={type.description} level={level} transparent>
        <div className={styles.root}>
          {
            value && value.length > 0 && (
              <div className={styles.list}>
                {this.renderList()}
              </div>
            )
          }
          <div className={styles.functions}>
            {
              this.props.type.of.length == 1
              && <Button onClick={this.handleAddBtnClick} className={styles.addButton}>
                Add
              </Button>
            }
            {
              this.props.type.of.length > 1 && this.renderSelectType()
            }
          </div>
        </div>
      </Fieldset>
    )
  }
}
