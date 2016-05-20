import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import RenderListItem from '../RenderListItem'
import {createFormBuilderState} from '../FormBuilderState'
import {resolveJSType} from '../types/utils'
import applyPatch from '../utils/applyPatch'

export default React.createClass({
  propTypes: {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.array,
    onChange: PropTypes.func
  },
  statics: {
    /* valueContainer: ArrayContainer */
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
      value: [],
      onChange() {}
    }
  },
  handleAddBtnClick() {
    if (this.props.type.of.length > 1) {
      this.setState({selectType: true})
      return
    }
    this.handleAddItem(this.getFieldType(this.props.type.of[0]))
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
  getFieldType(field) {
    const fieldType = this.context.schema.types[field.type]
    if (fieldType) {
      return fieldType
    }
    if (!BASIC_TYPE_NAMES.includes(field.type)) {
      // todo: this will normally fail during schema compilation, but keep it here for now and consider remove later
      const {fieldName} = this.props
      console.warn('Invalid field type of field "%s". Must be one of %s', fieldName, BASIC_TYPE_NAMES.join(', '))
    }
    // Treat as "anonymous"/inline type where type parameters are defined in field
    // todo: consider validate that the needed params are defined in field (currently also taken
    // care of during schema compilation)
    return field
  },
  renderSelectType() {
    const {type} = this.props
    return type.of.map(field => {
      return (
        <button
          key={field.type}
          onClick={() => this.handleAddItem(this.getFieldType(field))}
          type="button"
        >
          {field.title || field.type}
        </button>
      )
    })
  },
  handleAddItemChange(event) {
    this.setState({addItem: applyPatch(this.state.addItem, event.patch)})
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
        {value.map((item, i) => {
          const itemType = (item && item.$type) || resolveJSType(item)
          // find type in of

          const typeFromField = type.of.find(ofType => ofType.type === itemType)
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
