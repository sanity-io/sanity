import PropTypes from 'prop-types'
import React from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import DefaultTextField from 'part:@sanity/components/textfields/default'
import PatchEvent, {set, unset} from '../PatchEvent'

export default class NumberInput extends React.Component {
  static displayName = 'Number';

  static propTypes = {
    type: FormBuilderPropTypes.type,
    level: PropTypes.number.isRequired,
    value: PropTypes.number,
    onChange: PropTypes.func,
    hasFocus: PropTypes.bool
  };

  static defaultProps = {
    onChange() {}
  }

  handleChange = event => {
    const patch = event.target.value === '' ? unset() : set(Number(event.target.value))
    this.props.onChange(PatchEvent.from(patch))
  }

  render() {
    const {value, type, hasFocus, level} = this.props
    return (
      <DefaultTextField
        label={type.title}
        description={type.description}
        type="number"
        level={level}
        placeholder={type.placeholder || 'Must be a number'}
        onChange={this.handleChange}
        value={value}
        hasFocus={hasFocus}
      />
    )
  }
}
