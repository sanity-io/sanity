import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import ItemForm from './ItemForm'
import ItemPreview from './ItemPreview'
import ArrayContainer from './ArrayContainer'
import {createFieldValue} from '../../state/FormBuilderState'
import styles from './styles/Array.css'
import Button from '../../buttons/Default'
import EditItem from './EditItem'

export default class Arr extends React.Component {
  static displayName = 'Array';

  static valueContainer = ArrayContainer;

  static propTypes = {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.instanceOf(ArrayContainer),
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    schema: PropTypes.object
  };

  constructor(props, context) {
    super(props, context)
    this.handleAddBtnClick = this.handleAddBtnClick.bind(this)
    this.handleItemChange = this.handleItemChange.bind(this)
    this.handleItemEdit = this.handleItemEdit.bind(this)
    this.handleRemoveItem = this.handleRemoveItem.bind(this)
    this.handleItemEnter = this.handleItemEnter.bind(this)
    this.handleClose = this.handleClose.bind(this)

    this.state = {
      selectType: false,
      addItemField: null,
      editIndex: -1
    }
  }

  handleAddBtnClick() {
    if (this.props.type.of.length > 1) {
      this.setState({selectType: true})
      return
    }
    this.handleAddItem(this.props.type.of[0])
  }

  handleAddItem(field) {
    const addItemValue = createFieldValue(void 0, {
      field: field,
      schema: this.context.schema,
      // not too elegant atm.
      resolveContainer: (_field, type) => this.context.resolveInputComponent(_field, type).valueContainer
    })

    this.props.onChange({
      patch: {$unshift: [addItemValue]}
    })

    this.setState({
      selectType: false,
      editIndex: 0
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

  renderSelectType() {
    const {type} = this.props
    return type.of.map(field => {
      return (
        <Button
          key={field.type}
          onClick={() => this.handleAddItem(field)}
          type="button"
        >
          {field.title || field.type}
        </Button>
      )
    })
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
      <EditItem title={itemField.title} onClose={this.handleClose}>
        <ItemForm
          index={index}
          focus={index === 0}
          field={itemField}
          value={itemValue}
          onChange={this.handleItemChange}
          onEnter={this.handleItemEnter}
          onRemove={this.handleRemoveItem}
        />
      </EditItem>
    )
  }

  getItemField(item) {
    const {type} = this.props
    return type.of.find(ofType => ofType.type === item.context.field.type)
  }

  render() {
    const {type, field, value} = this.props
    const {selectType, editIndex} = this.state
    return (
      <div className={styles.array}>
        <Button type="button" onClick={this.handleAddBtnClick}>+ add {field.title}</Button>
        {selectType && this.renderSelectType()}
        {value && value.map((item, i) => {
          if (editIndex === i) {
            return this.renderEditItemForm(editIndex)
          }
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
            <div key={i} className={styles.item}>
              <ItemPreview
                index={i}
                field={itemField}
                value={item}
                onEdit={this.handleItemEdit}
                onRemove={this.handleRemoveItem}
              />
            </div>
          )
        })}
      </div>
    )
  }
}
