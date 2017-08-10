import PropTypes from 'prop-types'
// @flow weak
import React from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import FormField from 'part:@sanity/components/formfields/default'
import TextArea from 'part:@sanity/components/textareas/default'
import PatchEvent, {set, unset} from '../PatchEvent'

export default class TextInput extends React.PureComponent {

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: '',
    onChange() {}
  };

  handleChange = event => {
    const value = event.target.value || undefined
    this.props.onChange(PatchEvent.from(value ? set(value) : unset()))
  }

  render() {
    const {value, type, level, validation, ...rest} = this.props
    return (
      <FormField label={type.title} level={level} description={type.description}>
        <TextArea
          {...rest}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          rows={type.rows}
          value={value}
        />
      </FormField>
    )
  }
}
