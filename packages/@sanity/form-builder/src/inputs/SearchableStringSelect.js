import PropTypes from 'prop-types'
import React from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import FormField from 'part:@sanity/components/formfields/default'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import {find} from 'lodash'
import PatchEvent, {set} from '../PatchEvent'

export default class SearchableStringSelect extends React.Component {

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    value: '',
    onChange() {}
  };

  handleChange = item => {
    this.props.onChange(PatchEvent.from(set(item.value)))
  }

  render() {
    const {value, type, level} = this.props

    const items = type.options.list.map(item => {
      return {title: item, value: item}
    })

    const currentItem = find(items, item => {
      return item.title === value
    })

    return (
      <FormField label={type.title} level={level} description={type.description}>
        <SearchableSelect
          placeholder={type.placeholder}
          onChange={this.handleChange}
          onKeyPress={this.handleKeyPress}
          value={currentItem}
          items={items}
        />
      </FormField>

    )
  }
}
