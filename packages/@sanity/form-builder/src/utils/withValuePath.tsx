import React from 'react'
import {Path} from '@sanity/types'
import PropTypes from 'prop-types'

function getDisplayName(component) {
  return component.displayName || component.name || '<Anonymous>'
}

function warnMissingFocusMethod(ComposedComponent) {
  console.warn(
    `withValuePath(${getDisplayName(
      ComposedComponent
    )}): The passed component did not expose a ".focus()" method. Either implement an imperative focus method on the component instance, or forward it's received ref to an element that exposes a .focus() method. The component passed to withValuePath was: %O`,
    ComposedComponent
  )
}

export interface WithValuePathProps {
  getValuePath: () => Path
}

export default function withValuePath<T extends WithValuePathProps = WithValuePathProps>(
  ComposedComponent: React.ComponentType<T>
) {
  return class WithValuePath extends React.PureComponent<Omit<T, 'getValuePath'>> {
    _input: any
    _didShowFocusWarning = false
    static displayName = `withValuePath(${ComposedComponent.displayName || ComposedComponent.name})`
    static contextTypes = {
      getValuePath: PropTypes.any,
    }
    focus() {
      if (typeof this._input?.focus === 'function') {
        this._input.focus()
      } else if (!this._didShowFocusWarning) {
        warnMissingFocusMethod(ComposedComponent)
        this._didShowFocusWarning = true
      }
    }
    setRef = (input) => {
      this._input = input
    }
    render() {
      return (
        <ComposedComponent
          ref={this.setRef}
          getValuePath={this.context.getValuePath as WithValuePathProps['getValuePath']}
          {...(this.props as T)}
        />
      )
    }
  }
}
