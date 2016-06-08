import React, {PropTypes} from 'react'
import ObjectContainer from '../../../src/state/ObjectContainer'
import Field from '../../../src/Field'
import Fieldset from '../../../src/Fieldset'


export default class extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleLatChange = this.handleLatChange.bind(this)
    this.handleLonChange = this.handleLonChange.bind(this)
  }

  static valueContainer = ObjectContainer;

  static propTypes = {
    value: PropTypes.object,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    schema: PropTypes.object
  };

  handleLatChange(event) {
    this.handleFieldChange('lat', event.target.value)
  }

  handleLonChange(event) {
    this.handleFieldChange('lon', event.target.value)
  }

  handleFieldChange(fieldName, value) {
    this.props.onChange({
      patch: {
        [fieldName]: {$set: value}
      }
    })
  }

  render() {
    const {value} = this.props
    return (
      <Fieldset title="Langitude and Latitude">
        <Field label="Latitude" role="inFieldset">
          <input type="number" value={value && value.getFieldValue('lat')} onChange={this.handleLatChange} />
        </Field>
        <Field label="Longitude" role="inFieldset">
          <input type="number" value={value && value.getFieldValue('lon')} onChange={this.handleLonChange} />
        </Field>
      </Fieldset>
    )
  }
}
