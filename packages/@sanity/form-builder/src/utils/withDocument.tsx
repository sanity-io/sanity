import PropTypes from 'prop-types'
import React from 'react'

function getDisplayName(component) {
  return component.displayName || component.name || '<Anonymous>'
}

function warnMissingFocusMethod(ComposedComponent) {
  console.warn(
    `withDocument(${getDisplayName(
      ComposedComponent
    )}): The passed component did not expose a ".focus()" method. Either implement an imperative focus method on the component instance, or forward it's received ref to an element that exposes a .focus() method. The component passed to withDocument was: %O`,
    ComposedComponent
  )
}

export default function withDocument(ComposedComponent: any) {
  return class WithDocument extends React.PureComponent {
    _input: any
    _didShowFocusWarning = false
    static displayName = `withDocument(${ComposedComponent.displayName || ComposedComponent.name})`
    static contextTypes = {
      formBuilder: PropTypes.any,
    }
    state: {
      document: Record<string, any>
    }
    unsubscribe: () => void
    constructor(props: any, context: any) {
      super(props)
      const {formBuilder} = context
      this.state = {document: formBuilder.getDocument()}
      this.unsubscribe = formBuilder.onPatch(({snapshot}) => {
        // we will also receive "delete"-patches, with {snapshot: null}. Don't pass null documents.
        if (snapshot) {
          this.setState({document: snapshot})
        }
      })
    }
    componentWillUnmount() {
      this.unsubscribe()
    }
    focus() {
      if (typeof this._input?.focus === 'function') {
        this._input.focus()
      } else if (!this._didShowFocusWarning) {
        warnMissingFocusMethod(ComposedComponent)
        this._didShowFocusWarning = true
      }
    }
    setInput = (input) => {
      this._input = input
    }
    render() {
      return (
        <ComposedComponent ref={this.setInput} document={this.state.document} {...this.props} />
      )
    }
  }
}
