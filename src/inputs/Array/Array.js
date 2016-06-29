import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import ItemForm from './ItemForm'
import ItemPreview from './ItemPreview'
import ArrayContainer from './ArrayContainer'
import {createFieldValue} from '../../state/FormBuilderState'
import styles from './styles/Array.css'
import Button from 'component:@sanity/components/buttons/default'
import EditItem from './EditItem'
import DropDownButton from 'component:@sanity/components/buttons/dropdown'

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
    this.addItemAtEnd(this.props.type.of[0])
  }

  addItemAtStart(field) {
    this.addItemAt(field, 0)
  }

  addItemAtEnd(field) {
    this.addItemAt(field, this.props.value.length)
  }

  addItemAt(field, index) {
    const addItemValue = createFieldValue(undefined, {
      field: field,
      schema: this.context.schema,
      resolveInputComponent: this.context.resolveInputComponent
    })

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

  renderSelectType() {
    const {type} = this.props

    const items = type.of.map(field => {
      return {
        title: field.title || field.type,
        onClick: () => this.addItemAtEnd(field),
      }
    })

    return (
      <DropDownButton items={items} ripple inverted kind="add">
        New {this.props.field.title}
      </DropDownButton>
    )

    // return type.of.map(field => {
    //   return (
    //     <Button
    //       key={field.type}
    //       onClick={() => this.addItemAtEnd(field)}
    //       type="button"
    //     >
    //       Select type {field.title || field.type}
    //     </Button>
    //   )
    // })
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
          focus
          index={index}
          field={itemField}
          level={this.props.level + 1}
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
      <div className={styles.root}>
        <ul className={styles.list}>
          {value && value.map((item, i) => {

            const itemField = this.getItemField(item)

            if (!itemField) {
              return (
                <div>
                  <p>Invalid type: <pre>{JSON.stringify(item.context.field.type)}</pre></p>
                  <p>Only allowed types are: <pre>{JSON.stringify(type.of)}</pre></p>
                </div>
              )
            }

            const itemClass = editIndex == i ? styles.itemActive : styles.item

            return (
              <li key={i} className={itemClass}>
                <div className={styles.itemInner}>
                  <ItemPreview
                    index={i}
                    field={itemField}
                    value={item}
                    onEdit={this.handleItemEdit}
                    onRemove={this.handleRemoveItem}
                  />
                </div>
                {editIndex === i && this.renderEditItemForm(editIndex)}
              </li>
            )
          })}
        </ul>
        <div className={styles.primaryFunctions}>
          {
            this.props.type.of.length == 1
            && <Button onClick={this.handleAddBtnClick} ripple inverted kind="add">
              Add {field.title}
            </Button>
          }
          {
            this.props.type.of.length > 1 && this.renderSelectType()
          }

        </div>
      </div>
    )
  }
}
