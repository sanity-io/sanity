import React, {PropTypes} from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import {uniqueId} from 'lodash'

export default class FileInput extends React.PureComponent {

  static propTypes = {
    type: PropTypes.shape({}).isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: '',
    onChange() {}
  };

  handleChange = event => {
    const val = event.target.value || undefined
    this.props.onChange({patch: {type: 'set', value: val}})
  }

  render() {
    const {type, level} = this.props
    const inputId = uniqueId('FormBuilderFileInput')
    return (
      <FormField label={type.title} labelHtmlFor={inputId} level={level}>
        <File
          id={inputId}
          placeholder={type.placeholder}
          onChange={this.handleChange}
        />
      </FormField>
    )
  }
}
