import React from 'react'
import FormBuilderField from '../../FormBuilderFieldMixin'

export default React.createClass({

  displayName: 'StaticStyleString',

  mixins: [FormBuilderField],

  render() {
    return (
      <div className="form-builder__field  form-builder__static-style-string">
        <label className="form-builder__label form-builder__label--static">
          {this.props.field.title}
        </label>

        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }


        <div className='form-builder__item'>
          {this._getValue()}
        </div>
      </div>
    )
  }

})
