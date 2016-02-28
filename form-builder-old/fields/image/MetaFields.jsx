import React from 'react'

import FormBuilder from '../../FormBuilder'
import FormBuilderField from '../../FormBuilderFieldMixin'

export default React.createClass({
  displayName: 'MetaFields',
  mixins: [FormBuilderField],
  propTypes: {
    document: React.PropTypes.object,
    fields: React.PropTypes.array.isRequired,
    errors: React.PropTypes.array,
    fieldBuilders: React.PropTypes.object.isRequired,
    fieldPreviews: React.PropTypes.object.isRequired,
    validation: React.PropTypes.object,
    schema: React.PropTypes.object,
    onChange: React.PropTypes.func,
    value: React.PropTypes.object
  },

  getInitialState() {
    return {errors: {}}
  },

  mergeValue(changes) {
    return Object.assign({}, this._getValue() || {}, changes)
  },

  handleChange(changes) {
    this._setValue(this.mergeValue(changes))
  },

  render() {
    const {fields, document, schema, fieldBuilders, fieldPreviews, validation} = this.props
    return (
      <FormBuilder
        onFieldChange={this.handleFieldChange}
        onChange={this.handleChange}
        schema={schema}
        document={document}
        fields={fields}
        validation={validation}
        fieldBuilders={fieldBuilders}
        fieldPreviews={fieldPreviews}
        value={this._getValue()}/>
    )
  }
})
