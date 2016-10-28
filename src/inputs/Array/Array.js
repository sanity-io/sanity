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

const SortableDefaultList = SortableContainer(DefaultList)

const SortableItem = SortableElement(props => {
  return (
    <div disabled={props.disabled} key={props.index} index={props.index}>
      {props.children}
    </div>
  )
})

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
    editIndex: -1
  };

  handleAddBtnClick = () => {
    if (this.props.type.of.length > 1) {
      this.setState({selectType: true})
      return
    }

    this.append(this.createValueForField(this.props.type.of[0]))

    this.setState({
      selectType: false,
      editIndex: this.props.value.length
    })
  }

  append(value) {
    this.setIfMissing()
    this.props.onChange({
      patch: {
        type: 'append',
        value: value
      }
    })
  }

  setIfMissing() {
    const {value, onChange} = this.props
    if (value.isEmpty()) {
      onChange({
        patch: {
          type: 'setIfMissing',
          value: []
        }
      })
    }
  }
  prepend(value) {
    this.setIfMissing()
    this.props.onChange({
      patch: {
        type: 'prepend',
        value: value
      }
    })
  }

  createValueForField(field) {
    return {_type: field.type}
  }

  handleRemoveItem = index => {
    if (index === this.state.editIndex) {
      this.setState({editIndex: -1})
    }
    const patch = {
      type: 'unset',
      path: [index]
    }
    this.props.onChange({patch})
  }

  handleClose = () => {
    const {editIndex} = this.state
    const itemValue = this.props.value.at(editIndex)
    if (itemValue.isEmpty()) {
      this.handleRemoveItem(editIndex)
    }
    this.setState({editIndex: -1})
  }

  handleDropDownAction = menuItem => {
    this.append(this.createValueForField(menuItem.field))
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

  handleItemChange = (event, index) => {
    const {value, onChange} = this.props
    // Rewrite patch by prepending the item index to its path
    onChange({
      patch: {
        ...event.patch,
        path: [index, ...(event.patch.path || [])]
      }
    })
  }

  handleItemEdit = index => {
    this.setState({editIndex: index})
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
    this.setState({editIndex: -1})
  }

  renderEditItemForm(index) {
    const itemValue = this.props.value.at(index)
    const itemField = this.getItemField(itemValue)
    return (
      <EditItemPopOver title={itemField.title} onClose={this.handleClose}>
        <ItemForm
          focus
          index={index}
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
    const {editIndex} = this.state
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
      <SortableItem key={index} disabled={editIndex > 0} index={index}>
        <ItemPreview
          index={index}
          field={itemField}
          value={item}
          onEdit={this.handleItemEdit}
          onRemove={this.handleRemoveItem}
        />
        {editIndex === index && this.renderEditItemForm(editIndex)}
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
      />
    )
  }

  render() {
    const {field, level} = this.props

    return (
      <Fieldset legend={field.title} description={field.description} level={level}>

        {this.renderList()}

        <div>
          {
            this.props.type.of.length == 1
            && <Button onClick={this.handleAddBtnClick} ripple kind="add">
              Add
            </Button>
          }
          {
            this.props.type.of.length > 1 && this.renderSelectType()
          }

        </div>

      </Fieldset>
    )
  }
}
