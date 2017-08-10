import PropTypes from 'prop-types'
import React from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import TextInput from 'part:@sanity/components/textinputs/default'
import FormField from 'part:@sanity/components/formfields/default'
import PatchEvent, {set, unset} from '../PatchEvent'

export default class TelephoneInput extends React.PureComponent {
  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: '',
    onChange() {}
  }

  handleChange = event => {
    const value = event.target.value || undefined
    this.props.onChange(PatchEvent.from(value ? set(value) : unset()))
  }

  render() {
    const {value, type, level, validation, ...rest} = this.props

    return (
      <FormField
        level={level}
        label={type.title}
        description={type.description}
      >
        <TextInput
          {...rest}
          type="tel"
          value={value}
          placeholder={type.placeholder}
          onChange={this.handleChange}
        />
      </FormField>
    )
  }
}
