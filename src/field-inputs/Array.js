import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

// Just a stub for now
export default React.createClass({
  propTypes: {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.string,
    onChange: PropTypes.func
  },

  contextTypes: {
    resolveFieldInput: PropTypes.func,
    schema: PropTypes.object
  },

  getInitialState() {
    return {
      selecType: false
    }
  },
  getDefaultProps() {
    return {
      onChange() {}
    }
  },

  handleItemChange() {

  },

  renderItem(item) {
  },

  handleAddBtnClick() {
    this.setState({selectType: true})
  },

  renderSelectType() {
    const {type} = this.props
    return type.of.map(itemType => {
      return <button key={itemType} type="button">{itemType.title || itemType.type}</button>
    })
  },
  render() {
    const {type} = this.props
    const {selectType} = this.state
    return (
      <div>
        <button type="button" onClick={this.handleAddBtnClick}>Add item</button>
        {selectType && this.renderSelectType()}
        (show list of {type.of.map(item => item.type).join(', ')} here)
      </div>
    )
  }
})
