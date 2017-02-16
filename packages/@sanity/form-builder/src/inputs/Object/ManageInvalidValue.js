import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import React, {PropTypes} from 'react'
import DefaultButton from 'part:@sanity/components/buttons/default'
import styles from './styles/ManageInvalidValue.css'

export default class ManageInvalidValue extends React.PureComponent {

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.any,
    expectedJSType: PropTypes.string,
    valueJSType: PropTypes.string,
    onChange: PropTypes.func
  };

  handleResetClicked = () => {
    const {onChange, field} = this.props
    onChange({patch: {type: 'unset'}}, field)
  }

  render() {
    const {value, field, expectedJSType, valueJSType} = this.props
    return (
      <div className={styles.root}>
        <h3>{field.name}</h3>
        <p>
          {
          `Value type mismatch. Expected '${expectedJSType}' got '${valueJSType}'.`
        }
        </p>
        <p>
          {
            `The value is: ${JSON.stringify(value.value)}`
          }
        </p>
        <p>
          <DefaultButton onClick={this.handleResetClicked} color="danger">
            Reset
          </DefaultButton>
        </p>
      </div>
    )
  }
}
