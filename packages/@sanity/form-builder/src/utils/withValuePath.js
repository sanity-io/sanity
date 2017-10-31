import React from 'react'
import PropTypes from 'prop-types'

export default function withValuePath(ComposedComponent: any) {

  return class WithValuePath extends React.PureComponent {
    static displayName = `withValuePath(${ComposedComponent.displayName || ComposedComponent.name})`

    static contextTypes = {
      getValuePath: PropTypes.func,
      formBuilder: PropTypes.any,
    }

    render() {
      const {getValuePath} = this.context
      return <ComposedComponent {...this.props} getValuePath={getValuePath} />
    }
  }
}
