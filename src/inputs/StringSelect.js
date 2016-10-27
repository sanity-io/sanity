import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import equals from 'shallow-equals'
import Select from 'part:@sanity/components/selects/default'

export default class StringSelect extends React.Component {
  static displayName = 'StringSelect';

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
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
    this.setInputElement = this.setInputElement.bind(this)
  }

  setInputElement(element) {
    this.inputElement = element
  }

  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  handleChange(item) {
    this.props.onChange({patch: {type: 'set', value: item.title}})
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
    const {value, field, focus, level} = this.props

    const items = field.options.list.map(item => {
      return {title: item}
    })

    const currentItem = items.find(item => {
      return item.title == value
    })

    return (
      <Select
        label={field.title}
        level={level}
        type="text"
        value={currentItem || items[0]}
        placeholder={field.placeholder}
        onChange={this.handleChange}
        onKeyPress={this.handleKeyPress}
        onFocus={this.handleFocus}
        items={items}
        focus={focus}
        ref={this.setInputElement}
      />
    )
  }
}
