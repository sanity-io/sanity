import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import RenderListItem from '../RenderListItem'
import {resolveJSType} from '../types/utils'
import update from 'react-addons-update'

export default React.createClass({
  propTypes: {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.array,
    onChange: PropTypes.func
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
    this.handleAddItem(this.props.type.of[0])
  },

  handleAddItem(itemType) {
    this.setState({selectType: false, addItemType: itemType})
  },

  handleRemoveItem(index) {
    const {value} = this.props
    this.props.onChange(update(value, {
      $splice: [[index, 1]]
    }))
  },

  handleOK() {
    const item = this.state.addItem
    const {value} = this.props
    this.setState({selectType: false, addItemType: null, addItem: void 0})
    this.props.onChange([item].concat(value || []))
  },

  renderSelectType() {
    const {type} = this.props
    return type.of.map(itemType => {
      return (
        <button
          key={itemType}
          onClick={() => this.handleAddItem(itemType)}
          type="button"
        >
          {itemType.title || itemType.type}
        </button>
      )
    })
  },
  handleAddItemChange(newVal) {
    this.setState({addItem: newVal})
  },
  handleItemChange(newVal, index) {
    const {value} = this.props
    const spliceArgs = newVal ? [index, 1, newVal] : [index, 1]
    this.props.onChange(update(value, {
      $splice: [spliceArgs]
    }))
  },
  renderAddItemForm(addItemType) {
    return (
      <div>
        <h3>Add {addItemType.title}</h3>
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
