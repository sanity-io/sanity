import React from 'react'
import FormBuilder from '../../../form-builder/FormBuilder'
import Button from '../../../../widgets/Button'
import _t from '../../../../lib/translate'._t

const PropTypes = React.PropTypes
export default React.createClass({
  displayName: 'ItemEditor',
  propTypes: {
    schema: PropTypes.object,
    value: PropTypes.any,
    fieldPreviews: PropTypes.object,
    fieldBuilders: PropTypes.object,
    type: PropTypes.shape({
      name: PropTypes.string
    }),
    onChange: PropTypes.func,
    onCancel: PropTypes.func,
    onOk: PropTypes.func,
    validation: PropTypes.object
  },

  getInitialState() {
    return {locked: false}
  },

  handleChange(newValue) {
    this.props.onChange(newValue)
  },

  handleOk() {
    if (this.props.onOk) {
      this.props.onOk()
    }
  },

  handleLock() {
    if (this.props.onOk) {
      this.props.onOk()
    }
  },

  handleLockField(field, reason) {
    this.setState({locked: true})
    if (this.props.onLock) {
      this.props.onLock(reason)
    }
  },

  handleReleaseField(field) {
    this.setState({locked: false})
    if (this.props.onRelease) {
      this.props.onRelease()
    }
  },

  handleCancel() {
    if (this.props.onCancel) {
      this.props.onCancel()
    }
  },

  renderEditor() {
    const {value, type, schema, fieldBuilders, fieldPreviews} = this.props

    const FormField = fieldBuilders[type.name]

    if (FormField) {

      // Make a proforma field from type since we really got no field here
      // This is kind of a hack, needs refactoring
      const field = type

      const handleLockField = reason => {
        this.handleLockField(field, reason)
      }
      const handleReleaseField = () => {
        this.handleReleaseField(field)
      }

      return (
        <FormField
          document={value}
          field={field}
          fieldBuilders={fieldBuilders}
          fieldPreviews={fieldPreviews}
          schema={schema}
          onChange={this.handleChange}
          onLock={handleLockField}
          onRelease={handleReleaseField}
          value={value}
        />
      )
    }

    return (
      <FormBuilder
        onChange={this.handleChange}
        schema={schema}
        document={{}}
        fields={schema[type.name].attributes}
        fieldBuilders={fieldBuilders}
        fieldPreviews={fieldPreviews}
        validation={this.props.validation}
        onLockField={this.handleLockField}
        onReleaseField={this.handleReleaseField}
        value={value}
      />
    )
  },

  render() {
    const {locked} = this.state
    return (
      <div className="form-list-item-editor__inner">
        <div className='form-list-item-editor__editor'>
          {this.renderEditor()}
        </div>
        <div className="form-list-item-editor__functions">
          <Button disabled={locked} type="button" className="postitive" onClick={this.handleOk}>{_t('common.ok')}</Button>
          <Button type="button" className="negative" onClick={this.handleCancel}>{_t('common.cancel')}</Button>
        </div>
      </div>
    )
  }
})
