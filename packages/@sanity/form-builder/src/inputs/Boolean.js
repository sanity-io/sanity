import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import Switch from 'part:@sanity/components/toggles/switch'
import Checkbox from 'part:@sanity/components/toggles/checkbox'

export default class Bool extends React.Component {
  static displayName = 'Boolean';

  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.bool,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event) {
    this.props.onChange({
      patch: {
        type: 'set',
        value: event.target.checked
      }
    })
  }

  render() {
    const {value, type} = this.props

    if (type.options && type.options.layout == 'checkbox') {
      return (
        <Checkbox onChange={this.handleChange} checked={!!value} label={type.title} description={type.description} />
      )
    }

    return (
      <Switch onChange={this.handleChange} checked={!!value} label={type.title} description={type.description} />
    )
  }
}
