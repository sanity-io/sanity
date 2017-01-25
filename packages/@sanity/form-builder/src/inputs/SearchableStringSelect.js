import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import {find} from 'lodash'

export default class SearchableStringSelect extends React.Component {

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
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
    this.props.onChange({
      patch: {
        type: 'set',
        value: item.title
      }
    })
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
    const {value, type, focus, level} = this.props

    const items = type.options.list.map(item => {
      return {title: item}
    })

    const currentItem = find(items, item => {
      return item.title == value
    })

    return (
      <SearchableSelect
        label={type.title}
        level={level}
        placeholder={type.placeholder}
        description={type.description}
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
