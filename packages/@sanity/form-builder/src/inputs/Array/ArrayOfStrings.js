/* eslint-disable import/no-extraneous-dependencies */
import React, {PropTypes} from 'react'
import TagInput from 'part:@sanity/components/tags/textfield'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'

export default class ArrayOfStrings extends React.PureComponent {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.arrayOf(PropTypes.string),
    level: PropTypes.number,
    onChange: PropTypes.func,
    description: PropTypes.string,
    focus: PropTypes.bool
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  state = {
    hasFocus: this.props.focus
  }

  handleRemoveItem = index => {
    const nextVal = this.props.value.slice()
    nextVal.splice(index, 1)
    this.props.onChange({
      patch: {
        type: 'set',
        value: nextVal
      }
    })
  }

  handleFocus = () => {
    this.setState({
      hasFocus: true
    })
  }

  handleBlur = () => {
    this.setState({
      hasFocus: false
    })
  }

  handleAddString = string => {
    const {value, onChange} = this.props

    onChange({
      patch: {
        type: 'set', value: (value || []).concat(string)
      }
    })
  }

  render() {
    const {type, value, level, description} = this.props
    const {hasFocus} = this.state
    return (
      <TagInput
        label={type.title}
        level={level}
        description={description}
        tags={value || []}
        onRemoveTag={this.handleRemoveItem}
        onAddTag={this.handleAddString}
        focus={hasFocus}
      />
    )
  }
}
