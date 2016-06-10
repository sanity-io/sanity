import React, {PropTypes} from 'react'
import FormBuilderPropTypes from './FormBuilderPropTypes'
import styles from './styles/FormBuilder.css'

export class FormBuilder extends React.Component {
  static propTypes = {
    type: PropTypes.object.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    schema: FormBuilderPropTypes.schema,
  };

  static defaultProps = {
    onChange() {}
  }

  resolveInputComponent(field, type) {
    return this.context.resolveInputComponent(field, type)
  }

  render() {
    const {type, onChange, value} = this.props

    // Create a proforma field from type
    const field = {type: type.name}

    const FieldInput = this.resolveInputComponent(field, type)
    if (!FieldInput) {
      return <div>No field input resolved for field {JSON.stringify(field)}</div>
    }

    const passSerialized = value && value.constructor.passSerialized

    return (
      <div className={styles.root}>
        <div className={styles.inner}>
          <FieldInput
            field={field}
            type={type}
            onChange={onChange}
            value={passSerialized ? value.serialize() : value}
          />
        </div>
      </div>
    )
  }
}
