import React, {createContext} from 'react'
import PropTypes from 'prop-types'
import {SanityDocument} from '@sanity/types'

/**
 * @internal
 */
export const noContextValue = Symbol('Document Provider No-Context Value')
/**
 * @internal
 */
export const DocumentContext = createContext<SanityDocument | typeof noContextValue>(noContextValue)

interface DocumentProviderProps {
  children: React.ReactNode
}

interface DocumentProviderState {
  document: SanityDocument
}

/**
 * @internal
 */
export class DocumentProvider extends React.PureComponent<
  DocumentProviderProps,
  DocumentProviderState
> {
  unsubscribe: () => void

  static contextTypes = {
    formBuilder: PropTypes.any,
  }

  state = {
    document: this.context.formBuilder.getDocument(),
  }

  componentDidMount() {
    const {formBuilder} = this.context
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

  render() {
    const {children} = this.props
    return (
      <DocumentContext.Provider value={this.state.document}>{children}</DocumentContext.Provider>
    )
  }
}
