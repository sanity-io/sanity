import PropTypes from 'prop-types'
import React from 'react'
export default function withValuePath(ComposedComponent: any) {
  return class WithValuePath<P> extends React.PureComponent<P> {
    _input: typeof ComposedComponent
    static displayName = `withValuePath(${ComposedComponent.displayName || ComposedComponent.name})`
    static contextTypes = {
      getValuePath: PropTypes.func,
      formBuilder: PropTypes.any,
    }
    focus() {
      this._input.focus()
    }
    setInput = (input) => {
      this._input = input
    }
    render() {
      const {getValuePath} = this.context
      return <ComposedComponent ref={this.setInput} {...this.props} getValuePath={getValuePath} />
    }
  }
}
