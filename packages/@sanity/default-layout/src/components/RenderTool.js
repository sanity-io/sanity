import React, {Component} from 'react'
import PropTypes from 'prop-types'
import tools from 'all:part:@sanity/base/tool'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/RenderTool.css'
import ErrorBorkImage from './ErrorBorkImage'

function getErrorWithStack(err) {
  const stack = err.stack.toString()
  const message = err.message
  return stack.indexOf(message) === -1 ? `${message}\n\n${stack}` : stack
}

function limitStackLength(stack) {
  return stack
    .split('\n')
    .slice(0, 15)
    .join('\n')
}

function formatStack(stack) {
  return (
    stack
      // Prettify builder functions
      .replace(/\(\.\.\.\)\./g, '(...)\n  .')
      // Remove webpack cruft from function names
      .replace(/__WEBPACK_IMPORTED_MODULE_\d+_+/g, '')
      // Remove default export postfix from function names
      .replace(/___default\./g, '.')
      // Replace full host path, leave only path to JS-file
      .replace(new RegExp(` \\(https?:\\/\\/${window.location.host}`, 'g'), ' (')
  )
}

export default class RenderTool extends Component {
  static propTypes = {
    tool: PropTypes.string
  }

  static defaultProps = {
    tool: null
  }

  state = {error: null, showErrorDetails: __DEV__}

  componentDidCatch(error, info) {
    this.setState({error: {error, info}})
  }

  handleShowDetails = () => {
    this.setState({showErrorDetails: true})
  }

  handleRetry = () => {
    this.setState({error: null})
  }

  renderError() {
    const tool = this.getActiveTool() || {}
    const {error, info} = this.state.error
    const {showErrorDetails} = this.state

    return (
      <div className={styles.error}>
        <div className={styles.errorSplash}>
          <ErrorBorkImage />
          <h2 className={styles.errorHeading}>
            Rats! The {tool.title || tool.name || 'active'} tool crashed!
          </h2>

          <div className={styles.errorActionButton}>
            <Button onClick={this.handleRetry}>Retry</Button>
            <Button onClick={this.handleShowDetails} disabled={showErrorDetails}>
              Details
            </Button>
          </div>
        </div>

        {showErrorDetails && (
          <div className={styles.errorDetails}>
            <div className={styles.errorStackTraceWrapper}>
              <h3>Stack trace:</h3>
              <pre className={styles.errorStackTrace}>
                {formatStack(limitStackLength(getErrorWithStack(error)))}
              </pre>
            </div>

            <div className={styles.errorComponentStack}>
              <h3>Component stack:</h3>
              <pre>{info.componentStack.replace(/^\s*\n+/, '')}</pre>
            </div>
          </div>
        )}
      </div>
    )
  }

  getActiveTool() {
    const activeToolName = this.props.tool
    const activeTool = tools.find(tool => tool.name === activeToolName)
    return activeTool
  }

  render() {
    if (this.state.error) {
      return this.renderError()
    }

    if (!tools.length) {
      return (
        <div>
          No tools fulfills the part <code>`part:@sanity/base/tool`</code>
        </div>
      )
    }

    const activeTool = this.getActiveTool()
    if (!activeTool) {
      return <div>Tool not found: {this.props.tool}</div>
    }

    const ActiveTool = activeTool.component
    return <ActiveTool {...this.props} />
  }
}
