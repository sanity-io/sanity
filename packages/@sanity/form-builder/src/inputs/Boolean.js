import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import Switch from 'part:@sanity/components/toggles/switch'

export default class Bool extends React.Component {
  static displayName = 'Boolean';

  static propTypes = {
    type: FormBuilderPropTypes.type,
    level: PropTypes.number.isRequired,
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
    return (
      <Switch onChange={this.handleChange} checked={!!value} label={type.title} description={type.description} />
    )
  }
}
