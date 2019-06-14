import React from 'react'
import Snackbar from 'part:@sanity/components/snackbar/default'
import styles from './styles/ErrorHandler.css'

const SANITY_ERROR_HANDLER = Symbol.for('SANITY_ERROR_HANDLER')

export default class ErrorHandler extends React.PureComponent {
  state = {error: null}

  constructor(props) {
    super(props)

    this.handleGlobalError = this.handleGlobalError.bind(this)
    this.handleGlobalError.identity = SANITY_ERROR_HANDLER
  }

  componentDidMount() {
    // Only store the original error handler if it wasn't a copy of _this_ error handler
    if (window.onerror && window.onerror.identity !== SANITY_ERROR_HANDLER) {
      this.originalErrorHandler = window.onerror
    }

    window.onerror = this.handleGlobalError
  }

  componentWillUnmount() {
    window.onerror = this.originalErrorHandler || window.onerror
  }

  handleGlobalError = (msg, url, lineNo, columnNo, err) => {
    // Certain events (ResizeObserver max loop threshold, for instance)
    // only gives a _message_. We choose to ignore these events since
    // they are usually not _fatal_
    if (!err) {
      return
    }

    // Certain errors should be ignored
    if (
      [
        /unexpected token <$/i // Trying to load HTML as JS
      ].some(item => item.test(err.message))
    ) {
      return
    }

    // eslint-disable-next-line no-console
    console.error(err)
    this.setState({error: err})
  }

  handleClose = () => {
    this.setState({error: null})
  }

  render() {
    const {error} = this.state
    if (!error) {
      return null
    }

    const message = __DEV__ ? `An error occured: ${error.message}` : 'An error occured'

    return (
      <Snackbar kind="error" action={{title: 'Close'}} onAction={this.handleClose} timeout={2500}>
        <div className={styles.errorMessageHeader}>
          <strong>{message}</strong>
        </div>
        <div>Check browser javascript console for details</div>
      </Snackbar>
    )
  }
}
