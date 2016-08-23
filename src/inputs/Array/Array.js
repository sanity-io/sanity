/* eslint-disable import/no-extraneous-dependencies */
import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import ItemForm from './ItemForm'
import ItemPreview from './ItemPreview'
import ArrayContainer from './ArrayContainer'
import DropDownButton from 'component:@sanity/components/buttons/dropdown'
import Button from 'component:@sanity/components/buttons/default'
import Fieldset from 'component:@sanity/components/fieldsets/default'
import EditItemPopOver from 'component:@sanity/components/edititem/popover'
import DefaultList from 'component:@sanity/components/lists/default'
import GridList from 'component:@sanity/components/lists/grid'

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

  constructor(props, context) {
    super(props, context)
    this.handleAddBtnClick = this.handleAddBtnClick.bind(this)
    this.handleItemChange = this.handleItemChange.bind(this)
    this.handleItemEdit = this.handleItemEdit.bind(this)
    this.handleRemoveItem = this.handleRemoveItem.bind(this)
    this.handleItemEnter = this.handleItemEnter.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleDropDownAction = this.handleDropDownAction.bind(this)
    this.addItemAtEnd = this.addItemAtEnd.bind(this)
    this.renderItem = this.renderItem.bind(this)
    this.renderList = this.renderList.bind(this)

    this.state = {
      addItemField: null,
      editIndex: -1
    }
  }

  handleAddBtnClick() {
    if (this.props.type.of.length > 1) {
      this.setState({selectType: true})
      return
    }
    this.addItemAtEnd(this.props.type.of[0])
  }

  addItemAtStart(field) {
    this.addItemAt(field, 0)
  }

  addItemAtEnd(field) {
    this.addItemAt(field, this.props.value.length)
  }

  addItemAt(field, index) {
    const addItemValue = this.context.formBuilder.createFieldValue(undefined, field)

    this.props.onChange({
      patch: {$splice: [[index, 0, addItemValue]]}
    })

    this.setState({
      selectType: false,
      editIndex: index
    })
  }

  handleRemoveItem(index) {
    if (index === this.state.editIndex) {
      this.setState({editIndex: -1})
    }
    this.props.onChange({
      patch: {
        $splice: [[index, 1]]
      }
    })
  }

  handleClose() {
    const {editIndex} = this.state
    const itemValue = this.props.value.at(editIndex)
    if (itemValue.isEmpty()) {
      this.handleRemoveItem(editIndex)
    }
    this.setState({editIndex: -1})
  }

  handleDropDownAction(menuItem) {
    this.addItemAtEnd(menuItem.field)
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

  handleItemChange(event, index) {
    const patch = {[index]: event.patch}
    this.props.onChange({patch})

  }

  handleItemEdit(index) {
    this.setState({editIndex: index})
  }

  handleItemEnter() {
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

  renderItem(item, i) {
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
      <div key={i}>
        <ItemPreview
          index={i}
          field={itemField}
          value={item}
          onEdit={this.handleItemEdit}
          onRemove={this.handleRemoveItem}
        />
        {editIndex === i && this.renderEditItemForm(editIndex)}
      </div>
    )
  }

  renderList() {
    const {value, type} = this.props
    if (type.options && type.options.view == 'grid') {
      return <GridList renderItem={this.renderItem} items={value.value} />
    }
    return <DefaultList renderItem={this.renderItem} items={value.value} />
  }

  render() {
    const {field} = this.props

    return (
      <Fieldset legend={field.title} description={field.description}>

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
