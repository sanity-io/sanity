import React from 'react'
import FieldErrors from '../FieldErrors'

export default React.createClass({
  displayName: 'Boolean',
  handleChange(e) {
    this._setValue(e.target.checked)
  },
  render() {
    return (
      <div className="form-builder__field form-builder__boolean">
        <label className="form-builder__checkbox-label">
          <input {...this.props}
            className="form-builder__boolean__control"
            type='checkbox'
            checked={this._getValue() === true}
            onChange={this.handleChange}/>
          <span className='form-builder__boolean__label'> {this.props.field.title}</span>
        </label>
        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }
        <FieldErrors errors={this.props.errors}/>
      </div>
    )
  }
})
