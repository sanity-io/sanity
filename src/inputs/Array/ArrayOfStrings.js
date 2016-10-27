/* eslint-disable import/no-extraneous-dependencies */
import Arr from './Array'
import React, {PropTypes} from 'react'
import TagInput from 'part:@sanity/components/tags/textfield'
import ArrayContainer from './ArrayContainer'

export default class ArrayOfStrings extends React.Component {
  static propTypes = Arr.propTypes

  constructor(...args) {
    super(...args)

    this.handleRemoveItem = this.handleRemoveItem.bind(this)
    this.handleAddString = this.handleAddString.bind(this)
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  handleRemoveItem(index) {
    const nextVal = this.props.value.slice()
    nextVal.splice(index, 1)
    this.props.onChange({
      patch: {
        type: 'set',
        value: nextVal
      }
    })
  }

  handleAddString(string) {
    const {value, onChange} = this.props

    const current = value || []
    const nextValue = current.concat(string)

    onChange({
      patch: {
        type: 'set', value: nextValue
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
