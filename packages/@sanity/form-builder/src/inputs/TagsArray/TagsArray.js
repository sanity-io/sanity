// @flow
import PropTypes from 'prop-types'
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import TagInput from 'part:@sanity/components/tags/textfield'
import PatchEvent, {set, unset} from '../../PatchEvent'

export default class TagsInput extends React.PureComponent {
  static propTypes = {
    type: PropTypes.object,
    value: PropTypes.arrayOf(PropTypes.string),
    level: PropTypes.number,
    onChange: PropTypes.func
  }

  set(nextValue: string[]) {
    const patch = nextValue.length === 0 ? unset() : set(nextValue)
    this.props.onChange(PatchEvent.from(patch))
  }

  handleAddItem = itemValue => {
    this.set((this.props.value || []).concat(itemValue))
  }

  handleRemoveItem = (index: number) => {
    const copy = [].concat(this.props.value)
    copy.splice(index, 1)
    this.set(copy)
  }

  render() {
    const {type, value, level} = this.props
    return (
      <FormField
        level={level}
        label={type.title}
        description={type.description}
      >
      <TagInput
          label={type.title}
          level={level}
          description={type.description}
          tags={value || []}
          onRemoveTag={this.handleRemoveItem}
          onAddTag={this.handleAddItem}
        />
      </FormField>
    )
  }
}
