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
import {SortableContainer, SortableElement} from 'react-sortable-hoc'
import styles from './styles/Array.css'
import arrify from 'arrify'
import {getFieldType} from '../../schema/getFieldType'
import randomKey from './randomKey'

const SortableDefaultList = SortableContainer(DefaultList)

const SortableItem = SortableElement(props => {
  return (
    <div disabled={props.disabled} key={props.index}>
      {props.children}
    </div>
  )
})

function createProtoValue(schema, field) {
  const type = getFieldType(schema, field)
  if (field.type === 'object') {
    return {
      _key: randomKey(12)
    }
  }
  if (type.type !== 'object') {
    throw new Error(`Invalid item type: "${type.type}" Default array input can only handle object types (for now)`)
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
    field: FormBuilderPropTypes.field,
    value: PropTypes.instanceOf(ArrayContainer),
    level: PropTypes.number,
    onChange: PropTypes.func,
    description: PropTypes.string
  };

  static defaultProps = {
    onChange() {}
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  state = {
    addItemField: null,
    editItemKey: null
  };

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
    const {onChange} = this.props
    const patch = {
      type: 'unset',
      path: [{_key: item.key}]
    }
    if (item.key === this.state.editItemKey) {
      this.setState({editItemKey: null})
    }
    onChange({patch})
  }

  handleClose = () => {
    const {editItemKey} = this.state
    const itemValue = this.props.value.byKey(editItemKey)
    if (itemValue.isEmpty()) {
      this.handleRemoveItem(itemValue)
    }
    this.setState({editItemKey: null})
  }

  handleDropDownAction = menuItem => {
    const {value} = this.props
    const item = createProtoValue(value.context.schema, menuItem.field)
    this.setState({editItemKey: item._key})
    this.append(item)
  }

  renderSelectType() {
    const {type} = this.props

    const items = type.of.map((field, i) => {
      return {
        title: field.title || field.type,
        index: `action${i}`,
        field: field
      }
    })

    return (
      <DropDownButton items={items} ripple inverted kind="add" onAction={this.handleDropDownAction}>
        New {this.props.field.title}
      </DropDownButton>
    )
  }

  handleItemChange = (event, item) => {
    const {onChange} = this.props

    const itemTarget = item.key ? {_key: item.key} : this.value.indexOf(item)
    // Rewrite patch by prepending the item index to its path
    const patches = arrify(event.patch).map(patch => {
      return {
        ...patch,
        path: [itemTarget, ...(patch.path || [])]
      }
    })
    onChange({patch: patches})
  }

  handleItemEdit = item => {
    this.setState({editItemKey: item.key})
  }

  handleMove = event => {
    this.props.onChange({
      patch: {
        type: 'move',
        value: {from: event.oldIndex, to: event.newIndex}
      }
    })
  }

  handleItemEnter = () => {
    this.setState({editItemKey: null})
  }

  renderEditItemForm(key) {
    const itemValue = this.props.value.byKey(key)
    const itemField = this.getItemField(itemValue)
    return (
      <EditItemPopOver title={itemField.title} onClose={this.handleClose}>
        <ItemForm
          focus
          itemKey={key}
          field={itemField}
          level={this.props.level + 1}
          value={itemValue}
          onChange={this.handleItemChange}
          onEnter={this.handleItemEnter}
          onRemove={this.handleRemoveItem}
        />
      </EditItemPopOver>
    )
  }

  getItemField(item) {
    const {type} = this.props
    return type.of.find(ofType => ofType.type === item.context.field.type)
  }

  renderItem = (item, index) => {
    const {type} = this.props
    const {editItemKey} = this.state
    const itemField = this.getItemField(item)
    if (!itemField) {
      return (
        <div>
          <p>Invalid type: <pre>{JSON.stringify(item.context.field.type)}</pre></p>
          <p>Only allowed types are: <pre>{JSON.stringify(type.of)}</pre></p>
        </div>
      )
    }

    return (
      <SortableItem key={item.key} disabled={Boolean(editItemKey)} index={index}>
        <ItemPreview
          field={itemField}
          value={item}
          onEdit={this.handleItemEdit}
          onRemove={this.handleRemoveItem}
        />
        {editItemKey === item.key && this.renderEditItemForm(editItemKey)}
      </SortableItem>
    )
  }

  renderList() {
    const {value, type} = this.props
    if (type.options && type.options.view == 'grid') {
      return <GridList renderItem={this.renderItem} items={value.value} />
    }

    return (
      <SortableDefaultList
        lockAxis="y"
        distance={5}
        onSortEnd={this.handleMove}
        renderItem={this.renderItem}
        items={value.value}
        useDragHandle
        decoration="divider"
      />
    )
  }

  render() {
    const {field, level, value} = this.props

    return (
      <Fieldset legend={field.title} description={field.description} level={level}>
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
              && <Button onClick={this.handleAddBtnClick} color="primary" className={styles.addButton}>
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
