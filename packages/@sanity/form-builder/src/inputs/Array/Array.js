/* eslint-disable import/no-extraneous-dependencies */
import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import ItemForm from './ItemForm'
import ItemPreview from './ItemPreview'
import ArrayContainer from './ArrayContainer'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import Button from 'part:@sanity/components/buttons/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import DefaultList from 'part:@sanity/components/lists/default'
import GridList from 'part:@sanity/components/lists/grid'
import styles from './styles/Array.css'
import arrify from 'arrify'
import randomKey from './randomKey'
import {get} from 'lodash'

function createProtoValue(schema, type) {
  if (type.jsonType !== 'object') {
    throw new Error(`Invalid item type: "${type.type}". Default array input can only contain objects (for now)`)
  }
  return {
    _type: type.name,
    _key: randomKey(12)
  }
}

export default class Arr extends React.Component {
  static displayName = 'Array';
  static valueContainer = ArrayContainer;

  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.instanceOf(ArrayContainer),
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
    const {type, value} = this.props
    if (type.of.length > 1) {
      this.setState({selectType: true})
      return
    }

    const item = createProtoValue(value.context.schema, type.of[0])

    this.append(item)

    this.setState({
      selectType: false,
      editItemKey: item._key
    })
  }

  insert(itemValue, position, atIndex) {
    const {onChange} = this.props
    onChange({
      patch: [
        {
          path: [atIndex],
          type: 'insert',
          position: position,
          items: [itemValue]
        },
        {
          path: [],
          type: 'setIfMissing',
          value: [itemValue]
        }
      ]
    })
  }

  prepend(value) {
    this.insert(value, 'before', 0)
  }

  append(value) {
    this.insert(value, 'after', -1)
  }

  handleRemoveItem = item => {
    const {onChange, value} = this.props
    const target = item.key ? {_key: item.key} : value.indexOf(item)
    const patch = {
      type: 'unset',
      path: [target]
    }
    if (item.key === this.state.editItemKey) {
      this.setState({editItemKey: null})
    }
    onChange({patch})
  }

  handleClose = () => {
    const itemValue = this.getEditItem()
    if (itemValue.isEmpty()) {
      this.handleRemoveItem(itemValue)
    }
    this.setState({
      editItemKey: null,
      lastEditedItem: itemValue
    })
  }

  handleDropDownAction = menuItem => {
    const {value} = this.props
    const item = createProtoValue(value.context.schema, menuItem.type)
    this.setState({editItemKey: item._key})
    this.append(item)
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

  handleItemChange = (event, item) => {
    const {onChange, value} = this.props

    const key = item.key || randomKey(12)

    let setKeyPatch = []

    if (!item.key) {
      setKeyPatch = {
        path: [value.indexOf(item), '_key'],
        type: 'set',
        value: key
      }
    }

    // Rewrite patch by prepending the item index to its path
    const patches = []
      .concat(setKeyPatch)
      .concat(arrify(event.patch)
      .map(patch => {
        return {
          ...patch,
          path: [{_key: key}, ...(patch.path || [])]
        }
      }))
    onChange({patch: patches})
  }

  handleItemEdit = item => {
    this.setState({
      editItem: item,
      editItemKey: item.key || this.props.value.indexOf(item)
    })
  }

  handleMove = event => {
    const {value} = this.props
    const item = value.at(event.oldIndex)
    const refItem = value.at(event.newIndex)
    if (event.oldIndex === event.newIndex || item.key === refItem.key) {
      return
    }
    // console.log('from %d => %d', event.oldIndex, event.newIndex, event)
    this.props.onChange({
      patch: [
        {
          type: 'unset',
          path: [{_key: item.key}]
        },
        {
          type: 'insert',
          path: [{_key: refItem.key}],
          position: event.oldIndex > event.newIndex ? 'before' : 'after',
          items: [item.get()]
        }
      ]
    })
  }

  handleItemEnter = () => {
    this.setState({editItemKey: null})
  }

  renderEditItemForm(item) {
    const itemField = this.getItemType(item)
    return (
      <EditItemPopOver title={itemField.title} onClose={this.handleClose}>
        <ItemForm
          focus
          itemKey={item.key || this.props.value.indexOf(item)}
          type={itemField}
          level={this.props.level + 1}
          value={item}
          onChange={this.handleItemChange}
          onEnter={this.handleItemEnter}
          onRemove={this.handleRemoveItem}
        />
      </EditItemPopOver>
    )
  }

  getEditItem() {
    const {editItemKey} = this.state
    const {value} = this.props
    return typeof editItemKey === 'number'
    ? value.at(editItemKey)
    : value.byKey(editItemKey)
  }

  getItemType(item) {
    const {type} = this.props
    return type.of.find(member => member === item.context.type)
  }

  renderItem = (item, index) => {
    const {type} = this.props
    const itemType = this.getItemType(item)
    if (!itemType) {
      return (
        <div>
          <p>Invalid type: <pre>{JSON.stringify(item.context.type.name)}</pre></p>
          <p>Only allowed types are: <pre>{JSON.stringify(type.of.map(ofType => ofType.name))}</pre></p>
        </div>
      )
    }

    const layout = type.options && type.options.layout == 'grid' ? 'media' : 'default'

    return (
      <div>
        <ItemPreview
          type={itemType}
          value={item}
          layout={layout}
          onRemove={this.handleRemoveItem}
        />
        <div className={styles.popupAnchor}>
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
          items={value.value}
          onSelect={this.handleItemEdit}
          onSortEnd={this.handleMove}
          focusedItem={this.state.lastEditedItem}
          sortable={sortable}
        />
      )
    }

    return (
      <DefaultList
        items={value.value}
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
      <Fieldset legend={type.title} description={type.description} level={level}>
        <div className={styles.root}>
          {
            value.value && value.value.length > 0 && (
              <div className={styles.list}>
                {this.renderList()}
              </div>
            )
          }
          <div className={styles.functions}>
            {
              this.props.type.of.length == 1
              && <Button onClick={this.handleAddBtnClick} className={styles.addButton} color="primary">
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
