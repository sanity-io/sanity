import React from 'react'
import PropTypes from 'prop-types'

export default function withValuePath(ComposedComponent: any) {
  return class WithValuePath extends React.PureComponent {
    static displayName = `withValuePath(${ComposedComponent.displayName || ComposedComponent.name})`

    static contextTypes = {
      getValuePath: PropTypes.func,
      formBuilder: PropTypes.any
    }

    focus() {
      this._input.focus()
    }

    setInput = input => {
      this._input = input
    }

    render() {
      const {getValuePath} = this.context
      return <ComposedComponent ref={this.setInput} {...this.props} getValuePath={getValuePath} />
    }
  }
}
