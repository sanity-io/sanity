import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import Select from 'part:@sanity/components/selects/default'
import RadioSelect from 'part:@sanity/components/selects/radio'

export default class StringSelect extends React.PureComponent {
  static displayName = 'StringSelect';

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
  }

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
    this.setInputElement = this.setInputElement.bind(this)
    this.state = {
      hasFocus: this.props.hasFocus
    }
  }

  setInputElement(element) {
    this.inputElement = element
  }

  handleChange(item) {
    if (typeof (item) === 'object') {
      this.props.onChange({patch: {type: 'set', value: item.value}})
    }

    if (typeof (item) === 'string') {
      this.props.onChange({patch: {type: 'set', value: item}})
    }
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

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      this.props.onEnter()
    }
  }

  render() {
    const {value, type, level} = this.props

    // Support array of string if not objects
    let items = type.options.list

    if (typeof (items[0]) === 'string') {
      items = items.map(item => {
        return {
          title: item,
          value: item
        }
      })
    }

    const currentItem = items.find(item => {
      return item.value == value
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
        onBlur={this.handleBlur}
        items={items}
        hasFocus={this.state.hasFocus}
        ref={this.setInputElement}
      />
    )
  }
}
