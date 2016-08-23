import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import SearchableSelect from 'component:@sanity/components/selects/searchable'
import {find} from 'lodash'

export default class SearchableStringSelect extends React.Component {

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.string,
    focus: PropTypes.bool,
    onChange: PropTypes.func,
    onEnter: PropTypes.func,
  };

  static defaultProps = {
    value: '',
    onChange() {},
    onEnter() {},
    onFocus() {}
  };

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(item) {
    this.props.onChange({patch: {$set: item.title}})
  }

  handleFocus(event) {
    // Handle focus here
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      this.props.onEnter()
    }
  }

  render() {
    const {value, field, focus} = this.props

    const items = field.options.list.map(item => {
      return {title: item}
    })

    const currentItem = find(items, item => {
      return item.title == value
    })

    return (
      <SearchableSelect
        label={field.title}
        placeholder={field.options.placeholder}
        description={field.options.description}
        onChange={this.handleChange}
        onKeyPress={this.handleKeyPress}
        onFocus={this.handleFocus}
        value={currentItem}
        items={items}
        focus={focus}
      />
    )
  }
}
