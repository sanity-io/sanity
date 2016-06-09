import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import RenderListItem from './RenderListItem'
import ArrayContainer from './ArrayContainer'
import {createFieldValue} from '../../state/FormBuilderState'
import {resolveJSType} from '../../types/utils'
import styles from './styles/Array.css'
import Button from '../../buttons/Default'
import AddItem from './AddItem'

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
    this.handleAddItemChange = this.handleAddItemChange.bind(this)
    this.handleItemChange = this.handleItemChange.bind(this)
    this.handleOK = this.handleOK.bind(this)

    this.state = {
      selecType: false,
      addItemField: null,
      addItem: void 0
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

    this.setState({
      selectType: false,
      addItemField: field,
      addItem: addItemValue
    })
  }

  handleRemoveItem(index) {
    this.props.onChange({
      patch: {
        $splice: [[index, 1]]
      }
    })
  }

  handleOK() {
    const itemValue = this.state.addItem
    this.setState({selectType: false, addItemField: null, addItem: void 0})
    this.props.onChange({patch: {$unshift: [itemValue]}})
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

  handleAddItemChange(event) {
    this.setState({addItem: this.state.addItem.patch(event.patch)})
  }

  handleItemChange(event, index) {
    const patch = {[index]: event.patch}
    this.props.onChange({patch})
  }

  renderAddItemForm(addItemField) {
    return (
      <AddItem title={addItemField.title}>
        <RenderListItem index={-1} field={addItemField} value={this.state.addItem} onChange={this.handleAddItemChange} />
        <Button type="button" onClick={this.handleOK}>OK</Button>
      </AddItem>
    )
  }

  render() {
    const {type, value} = this.props
    const {selectType, addItemField} = this.state
    return (
      <div className={styles.array}>
        <Button type="button" onClick={this.handleAddBtnClick}>+ add</Button>
        {selectType && this.renderSelectType()}
        {addItemField && this.renderAddItemForm(addItemField)}
        {value && value.map((item, i) => {
          const itemValue = item.serialize()
          const itemType = (itemValue && itemValue.$type) || resolveJSType(itemValue)
          // find type in of

          const typeFromField = type.of.find(ofType => ofType.type === itemType)

          if (!typeFromField) {
            return (
              <div>
                <p>Invalid type: <pre>{JSON.stringify(itemType)}</pre></p>
                <p>Only allowed types are: <pre>{JSON.stringify(type.of)}</pre></p>
              </div>
            )
          }

          return (
            <div key={i} className={styles.item}>
              <RenderListItem index={i} field={typeFromField} value={item} onChange={this.handleItemChange} />
            </div>
          )
        })}
      </div>
    )
  }
}
