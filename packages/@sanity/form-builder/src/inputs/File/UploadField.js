import React, {PropTypes} from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import {uniqueId} from 'lodash'
import PatchEvent, {set, unset} from '../../PatchEvent'

export default class FileInput extends React.PureComponent {

  static propTypes = {
    type: PropTypes.shape({}).isRequired,
    level: PropTypes.number.isRequired,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: '',
    onChange() {}
  };

  _inputId = uniqueId('FormBuilderFileInput')

  handleChange = event => {
    const value = event.target.value
    this.props.onChange(PatchEvent(value ? set(value) : unset()))
  }

  render() {
    const {type, level} = this.props
    return (
      <FormField label={type.title} labelHtmlFor={this._inputId} level={level}>
        <File
          id={this._inputId}
          placeholder={type.placeholder}
          onChange={this.handleChange}
        />
      </FormField>
    )
  }
}
