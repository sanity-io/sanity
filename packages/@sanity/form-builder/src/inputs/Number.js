import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import DefaultTextField from 'part:@sanity/components/textfields/default'

export default class Num extends React.Component {
  static displayName = 'Number';

  static propTypes = {
    type: FormBuilderPropTypes.type,
    level: PropTypes.number.isRequired,
    value: PropTypes.number,
    onChange: PropTypes.func,
    focus: PropTypes.bool
  };

  static defaultProps = {
    onChange() {}
  }

  handleChange = event => {
    const nextValue = event.target.value === '' ? undefined : Number(event.target.value)
    this.props.onChange({
      patch: {
        type: (typeof nextValue === 'undefined') ? 'unset' : 'set',
        path: [],
        value: nextValue
      }
    })
  }

  setInputElement = input => {
    this.inputElement = input
  }

  render() {
    const {value, type, focus, level} = this.props
    return (
      <DefaultTextField
        label={type.title}
        description={type.description}
        type="number"
        level={level}
        placeholder={type.placeholder || 'Must be a number'}
        onChange={this.handleChange}
        value={typeof value === 'undefined' ? value : Number(value)}
        focus={focus}
      />
    )
  }
}
