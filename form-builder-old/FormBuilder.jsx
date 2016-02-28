import React from 'react'
import cx from 'classnames'
import Modal from '../Modal'

export default React.createClass({
  propTypes: {
    fieldBuilders: React.PropTypes.object.isRequired,
    fieldPreviews: React.PropTypes.object.isRequired,
    fields: React.PropTypes.array.isRequired,
    schema: React.PropTypes.object.isRequired,
    onLockField: React.PropTypes.func,
    onReleaseField: React.PropTypes.func
  },

  mixins: [ControlledValue],

  handleFieldChange(field, newValue) {
    if (this.props.onFieldChange) {
      this.props.onFieldChange(field, newValue)
    }
    const change = {}
    change[field.name] = newValue
    const newDoc = Object.assign({}, this._getValue(), change)
    this._setValue(newDoc)
  },

  handleLockField(field, reason) {
    const {onLockField} = this.props
    if (onLockField) {
      onLockField(field, reason)
    }
  },

  handleReleaseField(field, reason) {
    const {onReleaseField} = this.props
    if (onReleaseField) {
      onReleaseField(field, reason)
    }
  },

  render() {

    const schema = this.props.schema
    const fields = this.props.fields
    const value = this._getValue() || {}
    const validation = this.props.validation || {}
    const fieldBuilders = this.props.fieldBuilders
    const fieldPreviews = this.props.fieldPreviews
    const validateDocument = this.props.validateDocument

    if (!fields || fields.length === 0) {
      return (
        <Modal className="modal modal--message modal--error" visible={true}>
          <h2 className="modal__headline">
            {_t('formBuilder.errors.modalHeader')}
          </h2>
          <div className="modal__text">
            <p className="modal__code">
              {_t('formBuilder.errors.noFieldsFound')}
            </p>
            <p>
              {_t('formBuilder.errors.contactTechnician')}
            </p>
          </div>
        </Modal>
      )
    }

    return (
      <div className="form-builder">
        {
          fields.map((field, i) => {
            const fieldValue = value[field.name]
            const FormField = fieldBuilders[field.type]
            const errors = validation[field.name]
            const hasErrors = errors && errors.length > 0
            const isCustomField = !FormField && schema[field.type]
            const fieldTypeDefined = FormField || schema[field.type]

            const handleFieldChange = newValue => {
              this.handleFieldChange(field, newValue)
            }
            const handleLockField = reason => {
              this.handleLockField(field, reason)
            }
            const handleReleaseField = () => {
              this.handleReleaseField(field)
            }
            if (isCustomField) {
              import Custom from './fields/Custom'
              return (
                <Custom
                  attributes={schema[field.type].attributes}
                  docType={field.type}
                  fieldBuilders={fieldBuilders}
                  fieldPreviews={fieldPreviews}
                  key={field.name + '_' + i}
                  ref={field.name}
                  errors={errors}
                  document={value}
                  field={field}
                  schema={schema}
                  value={fieldValue}
                  onChange={handleFieldChange}
                  onLock={handleLockField}
                  onRelease={handleReleaseField}
                />
              )
            }

            if (!fieldTypeDefined) {
              return (
                <Modal key='error' className="modal modal--error modal--message" visible={true}>
                  <a className="modal__close-cross"></a>
                  <h1 className="modal__headline">{_t('formBuilder.errors.modalHeader')}</h1>
                  <div className="modal__text">
                    <p className="modal__code">
                      {_t('formBuilder.errors.noFieldForType', null, {type: field.type})}
                    </p>
                    <p>
                      {_t('formBuilder.errors.contactTechnician')}
                    </p>
                  </div>
                  <div className="modal__buttons">
                  </div>
                </Modal>
              )
            }

            return (
              <FormField
                key={field.name}
                className={cx({invalid: hasErrors})}
                value={fieldValue}
                errors={errors}
                ref={field.name}
                document={value}
                field={field}
                fieldBuilders={fieldBuilders}
                fieldPreviews={fieldPreviews}
                validateDocument={validateDocument}
                schema={schema}
                onChange={handleFieldChange}
                onLock={handleLockField}
                onRelease={handleReleaseField}
              />
            )
          })
        }
      </div>
    )
  }
})
