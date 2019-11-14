/* eslint-disable react/jsx-no-bind , no-console, class-methods-use-this */

import React from 'react'
import PropTypes from 'prop-types'
import ArrowRight from 'part:@sanity/base/arrow-right'
import styles from './ErrorBoundary.css'

class ErrorBoundary extends React.PureComponent {
  static getDerivedStateFromError(error) {
    const message = `Error while rendering hint component. This isn't your fault! We're very sorry!`
    console.warn(message, error)
    return {errorMessage: message}
  }

  state = {
    errorMessage: null
  }

  render() {
    const {errorMessage} = this.state

    if (errorMessage) {
      return (
        <div className={styles.root}>
          <button
            className={styles.backButton}
            onClick={() => this.props.onBackClick(null)}
            type="button"
          >
            <ArrowRight /> Back
          </button>
          <p className={styles.errorMessage}>{errorMessage}</p>
        </div>
      )
    }
    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onBackClick: PropTypes.func.isRequired
}

export default ErrorBoundary
