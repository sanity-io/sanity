import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

export default class extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.object,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    schema: PropTypes.object
  };

  render() {
    const {type} = this.props
    return (
      <div>
        <div>Show reference picker for {type.to.map(to => to.type).join(', ')}</div>
      </div>
    )
  }
}
