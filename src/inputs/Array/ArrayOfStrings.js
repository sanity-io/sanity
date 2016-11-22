/* eslint-disable import/no-extraneous-dependencies */
import React, {PropTypes} from 'react'
import TagInput from 'part:@sanity/components/tags/textfield'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'

export default class ArrayOfStrings extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.arrayOf(PropTypes.string),
    level: PropTypes.number,
    onChange: PropTypes.func,
    description: PropTypes.string
  };

  static contextTypes = {
    formBuilder: PropTypes.object
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

  handleAddString = string => {
    const {value, onChange} = this.props

    onChange({
      patch: {
        type: 'set', value: (value || []).concat(string)
      }
    })
  }

  render() {
    const {field, value} = this.props

    return (
      <TagInput
        label={field.title}
        description={field.description}
        tags={value || []}
        onRemoveTag={this.handleRemoveItem}
        onAddTag={this.handleAddString}
      />
    )
  }
}
