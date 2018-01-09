import React from 'react'
import PropTypes from 'prop-types'

export default function withDocument(ComposedComponent: any) {

  return class WithDocument extends React.PureComponent {
    static displayName = `withDocument(${ComposedComponent.displayName || ComposedComponent.name})`

    static contextTypes = {
      formBuilder: PropTypes.any,
    }

    state: {
      document: Object
    }
    unsubscribe: () => void

    constructor(props : any, context: any) {
      super()
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
      this._input.focus()
    }
    setInput = input => {
      this._input = input
    }
    render() {
      return <ComposedComponent ref={this.setInput} document={this.state.document} {...this.props} />
    }
  }
}
