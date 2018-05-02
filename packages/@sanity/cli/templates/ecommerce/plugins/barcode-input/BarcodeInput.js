import React, {PureComponent} from 'react' // eslint-disable-line import/no-unresolved
import PropTypes from 'prop-types'
import {FormBuilderInput, patches} from 'part:@sanity/form-builder'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import Barcode from 'react-barcode' // eslint-disable-line import/no-unresolved
import styles from './BarcodeInput.css'

const {setIfMissing} = patches

export default class BarcodeInput extends PureComponent {
  state = {
    valid: true
  }

  static propTypes = {
    level: PropTypes.number,
    value: PropTypes.object,
    onChange: PropTypes.func,
    type: PropTypes.string,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func
  }

  handleFieldChange = (field, fieldPatchEvent) => {
    const {onChange, type} = this.props
    onChange(fieldPatchEvent.prefixAll(field.name).prepend(setIfMissing({_type: type.name})))
  }

  handleValid = valid => {
    this.setState({valid})
  }

  render() {
    const {level, type, value} = this.props
    const {valid} = this.state
    return (
      <Fieldset level={level} legend={type.title} description={type.description}>
        <div className={valid ? styles.barcodeValid : styles.barcodeInvalid}>
          {value &&
            value.barcode && (
              <Barcode
                textAlign="center"
                value={value.barcode}
                format={value.format || ''}
                valid={this.handleValid} // eslint-disable-line react/jsx-handler-names
              />
            )}
        </div>
        {!valid && <p className={styles.errorMessage}>Not valid {value.format}</p>}
        <div className={styles.fieldWrapper}>
          {type.fields.map(field => (
            <FormBuilderInput
              key={field.name}
              type={field.type}
              value={value && value[field.name]}
              onChange={patchEvent => this.handleFieldChange(field, patchEvent)}
              onBlur={this.props.onBlur}
              onFocus={this.props.onFocus}
            />
          ))}
        </div>
      </Fieldset>
    )
  }
}
