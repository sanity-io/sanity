import React from 'react'
import PropTypes from 'prop-types'
import Details from './inputs/common/Details'
import styles from './styles/FormBuilderErrorBoundary.css'

// eslint-disable-next-line react/require-optimization
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {error: false}
  }

  static getDerivedStateFromError(error) {
    return {error}
  }

  // eslint-disable-next-line class-methods-use-this
  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error('Input component crashed:', error)
  }

  render() {
    const error = this.state.error
    if (!error) {
      return this.props.children
    }

    return (
      <div className={styles.root} tabIndex={0} ref={this.setElement}>
        <h3>Rats! The input component crashed.</h3>
        <Details>
          <pre>{error.message}</pre>
          <em>(check developer tools console for details)</em>
        </Details>
      </div>
    )
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
}

export default ErrorBoundary
