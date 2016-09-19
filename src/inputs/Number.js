import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import DefaultTextField from 'component:@sanity/components/textfields/default'

export default class Num extends React.Component {
  static displayName = 'Number';

  static propTypes = {
    field: FormBuilderPropTypes.field,
    level: PropTypes.number.isRequired,
    value: PropTypes.number,
    onChange: PropTypes.func,
    focus: PropTypes.bool
  };

  static defaultProps = {
    onChange() {}
  };

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(e) {
    const val = e.target.value.trim()
    this.props.onChange({patch: {$set: val === '' ? undefined : Number(e.target.value)}})
  }

  render() {
    const {value, field, focus, level} = this.props
    return (
      <DefaultTextField
        label={field.title}
        type="number"
        level={level}
        placeholder={field.placeholder || 'Must be a number. Ex 1234'}
        onChange={this.handleChange}
        onKeyPress={this.handleKeyPress}
        value={String(value)}
        focus={focus}
        ref={this.setInputElement}
      />
    )
  }
}
