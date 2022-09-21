import PropTypes from 'prop-types'
import React from 'react'
import {SanityDocument} from '@sanity/types'

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

export interface WithDocumentProps<Doc extends SanityDocument = SanityDocument> {
  document: Doc
}

export default function withDocument<T extends WithDocumentProps = WithDocumentProps>(
  ComposedComponent: React.ComponentType<T>
) {
  return class WithDocument extends React.PureComponent<Omit<T, 'document'>> {
    _input: any
    _didShowFocusWarning = false
    static displayName = `withDocument(${ComposedComponent.displayName || ComposedComponent.name})`
    static contextTypes = {
      formBuilder: PropTypes.any,
    }
    state: {
      document: Record<string, unknown>
    }
    unsubscribe: () => void
    constructor(props: T, context: any) {
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
    setRef = (input) => {
      this._input = input
    }
    render() {
      return (
        <ComposedComponent
          ref={this.setRef}
          document={this.state.document}
          {...(this.props as T)}
        />
      )
    }
  }
}
