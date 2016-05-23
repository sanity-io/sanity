import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import RenderListItem from '../RenderListItem'
import ArrayContainer from '../state/ArrayContainer'
import {createFormBuilderState} from '../state/FormBuilderState'
import {resolveJSType} from '../types/utils'
import {getFieldType} from '../utils/getFieldType'

export default React.createClass({
  propTypes: {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.array,
    onChange: PropTypes.func
  },
  statics: {
    valueContainer: ArrayContainer
  },
  contextTypes: {
    resolveFieldInput: PropTypes.func,
    schema: PropTypes.object
  },

  getInitialState() {
    return {
      selecType: false,
      addItemType: null,
      addItem: void 0
    }
  },
  getDefaultProps() {
    return {
      onChange() {}
    }
  },
  handleAddBtnClick() {
    if (this.props.type.of.length > 1) {
      this.setState({selectType: true})
      return
    }
    this.handleAddItem(getFieldType(this.context.schema, this.props.type.of[0]))
  },

  handleAddItem(itemType) {
    const addItemValue = createFormBuilderState(void 0, {
      type: itemType,
      schema: this.context.schema,
      resolveFieldInput: this.context.resolveFieldInput
    })

    this.setState({
      selectType: false,
      addItemType: itemType,
      addItem: addItemValue
    })
  },

  handleRemoveItem(index) {
    this.props.onChange({
      patch: {
        $splice: [[index, 1]]
      }
    })
  },

  handleOK() {
    const itemValue = this.state.addItem
    this.setState({selectType: false, addItemType: null, addItem: void 0})
    this.props.onChange({patch: {$unshift: [itemValue]}})
  },
  renderSelectType() {
    const {type} = this.props
    return type.of.map(field => {
      return (
        <button
          key={field.type}
          onClick={() => this.handleAddItem(getFieldType(this.context.schema, field))}
          type="button"
        >
          {field.title || field.type}
        </button>
      )
    })
  },
  handleAddItemChange(event) {
    this.setState({addItem: this.state.addItem.patch(event.patch)})
  },
  handleItemChange(event, index) {
    const patch = {[index]: event.patch}
    this.props.onChange({patch})
  },
  renderAddItemForm(addItemType) {
    return (
      <div>
        <b>Add {addItemType.title}</b>
        <RenderListItem index={-1} field={addItemType} value={this.state.addItem} onChange={this.handleAddItemChange} />
        <button type="button" onClick={this.handleOK}>OK</button>
      </div>
    )
  },
  render() {
    const {type, value} = this.props
    const {selectType, addItemType} = this.state
    return (
      <div>
        <button type="button" onClick={this.handleAddBtnClick}>+</button>
        {selectType && this.renderSelectType()}
        {addItemType && this.renderAddItemForm(addItemType)}
        {value && value.map((item, i) => {
          const itemValue = item.unwrap()
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
            <div key={i}>
              <RenderListItem index={i} field={typeFromField} value={item} onChange={this.handleItemChange} />
            </div>
          )
        })}
      </div>
    )
  }
})
