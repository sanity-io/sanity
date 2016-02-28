import React from 'react'
import FormBuilderField from '../../FormBuilderFieldMixin'
import ReferencePicker from './ReferencePicker'

import Image from '../image/Image'

const PropTypes = React.PropTypes

export default React.createClass({
  displayName: 'Reference',
  mixins: [FormBuilderField],
  propTypes: {
    field: PropTypes.shape({
      to: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.arrayOf(PropTypes.shape({
          type: PropTypes.string,
          meta: PropTypes.string
        })),
        PropTypes.shape({
          type: PropTypes.string,
          meta: PropTypes.string
        })
      ]).isRequired,
      onLock: React.PropTypes.func,
      onRelease: React.PropTypes.func
    })
  },

  handleChange(value) {
    this._setValue(value)
  },

  getReferenceEditor() {
    const {field} = this.props
    // todo: remove this hack
    if (field.to === 'image') {
      return Image
    }
    return ReferencePicker
  },

  render() {

    const {fieldPreviews, fieldBuilders, field, document, schema, errors, onLock, onRelease} = this.props
    const Picker = this.getReferenceEditor()

    return (
      <div className="form-builder__field form-builder__reference">
        <label className="form-builder__label">{field.title}</label>
        {
          field.description &&
            <div className='form-builder__help-text'>{field.description}</div>
        }
        <div className='form-builder__item'>
          <Picker
            field={field}
            document={document}
            schema={schema}
            errors={errors}
            fieldPreviews={fieldPreviews}
            fieldBuilders={fieldBuilders}
            onChange={this.handleChange}
            onLock={onLock}
            onRelease={onRelease}
            value={this._getValue()}
            />
        </div>
      </div>
    )
  }
})
