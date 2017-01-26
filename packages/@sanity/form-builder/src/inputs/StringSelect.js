import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import equals from 'shallow-equals'
import Select from 'part:@sanity/components/selects/default'
import RadioSelect from 'part:@sanity/components/selects/radio'

export default class StringSelect extends React.Component {
  static displayName = 'StringSelect';

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.shape({
      value: PropTypes.string,
      title: PropTypes.string
    }),
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
    this.props.onChange({patch: {type: 'set', value: item}})
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

    // Support array of string if not objects
    const items = type.options.list

    const currentItem = items.find(item => {
      return item == value
    })

    if (type.options.layout == 'radio') {
      return (
        <RadioSelect
          name={type.name}
          legend={type.title}
          level={level}
          items={items}
          onChange={this.handleChange}
          value={currentItem || items[0]}
          direction={type.options.direction || 'vertical'}
        />
      )
    }

    return (
      <Select
        label={type.title}
        level={level}
        type="text"
        value={currentItem || items[0]}
        placeholder={type.placeholder}
        description={type.description}
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
