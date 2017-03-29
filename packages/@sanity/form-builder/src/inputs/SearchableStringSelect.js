import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import {find} from 'lodash'
import PatchEvent, {set} from '../PatchEvent'

export default class SearchableStringSelect extends React.Component {

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    hasFocus: PropTypes.bool,
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
    this.props.onChange(PatchEvent.from(set(item.value)))
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      this.props.onEnter()
    }
  }

  render() {
    const {value, type, hasFocus, level} = this.props

    const items = type.options.list.map(item => {
      return {title: item, value: item}
    })

    const currentItem = find(items, item => {
      return item.title === value
    })

    return (
      <SearchableSelect
        label={type.title}
        level={level}
        placeholder={type.placeholder}
        description={type.description}
        onChange={this.handleChange}
        onKeyPress={this.handleKeyPress}
        value={currentItem}
        items={items}
        hasFocus={hasFocus}
      />
    )
  }
}
