import PropTypes from 'prop-types'
import React from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import TextInput from 'part:@sanity/components/textinputs/default'
import FormField from 'part:@sanity/components/formfields/default'
import PatchEvent, {set, unset} from '../PatchEvent'

export default class StringInput extends React.PureComponent {
  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func,
    onFocus: PropTypes.func.isRequired,
    focusPath: PropTypes.array,
    onBlur: PropTypes.func.isRequired
  };

  static defaultProps = {
    value: '',
    onChange() {}
  }

  handleChange = event => {
    const value = event.target.value || undefined
    this.props.onChange(PatchEvent.from(value ? set(value) : unset()))
  }

  handleFocus = () => {
    this.props.onFocus([true])
  }

  handleBlur = () => {
    this.props.onBlur([])
  }

  focus() {
    this._input.focus()
  }

  setInput = el => {
    this._input = el
  }

  render() {
    const {value, type, focusPath, level, ...rest} = this.props

    return (
      <FormField
        level={level}
        label={type.title}
        description={type.description}
      >
        <TextInput
          {...rest}
          type="text"
          value={value}
          readOnly={type.readOnly}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          ref={this.setInput}
        />
      </FormField>
    )
  }
}
