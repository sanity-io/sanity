import PropTypes from 'prop-types'
import React from 'react'
import TextInput from 'part:@sanity/components/textinputs/default'
import FormField from 'part:@sanity/components/formfields/default'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import PatchEvent, {set, unset} from '../PatchEvent'

export default class NumberInput extends React.PureComponent {
  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.number,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  }

  handleChange = event => {
    const patch = event.target.value === '' ? unset() : set(Number(event.target.value))
    this.props.onChange(PatchEvent.from(patch))
  }

  render() {
    const {value, type, level, ...rest} = this.props

    return (
      <FormField
        level={level}
        label={type.title}
        description={type.description}
      >
        <TextInput
          {...rest}
          type="number"
          value={value}
          readOnly={type.readOnly}
          placeholder={type.placeholder}
          onChange={this.handleChange}
        />
      </FormField>
    )
  }
}
