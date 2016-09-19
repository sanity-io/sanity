import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import Switch from 'component:@sanity/components/toggles/switch'

export default class Bool extends React.Component {
  static displayName = 'Boolean';

  static propTypes = {
    field: FormBuilderPropTypes.field,
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
    this.props.onChange({patch: {$set: event.target.checked}})
  }

  render() {
    const {value, field} = this.props
    return (
      <Switch onChange={this.handleChange} checked={!!value} label={field.title} />
    )
  }
}
