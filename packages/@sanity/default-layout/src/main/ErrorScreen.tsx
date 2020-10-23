import Button from 'part:@sanity/components/buttons/default'
import React from 'react'

import styles from './ErrorScreen.css'

interface Props {
  activeTool?: {
    name: string
    title: string
  }
  error: {
    message: string
    stack: string
  }
  info: {
    componentStack: string
  }
  onRetry: () => void
  onShowDetails: () => void
  showErrorDetails: boolean
}

function getErrorWithStack(err: {message: string; stack: string}) {
  const stack = err.stack.toString()
  const message = err.message
  return stack.indexOf(message) === -1 ? `${message}\n\n${stack}` : stack
}

function limitStackLength(stack: string) {
  return stack.split('\n').slice(0, 15).join('\n')
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

function ErrorScreen(props: Props) {
  const {activeTool, error, info, onRetry, onShowDetails, showErrorDetails} = props
  const toolName = (activeTool && (activeTool.title || activeTool.name)) || 'active'

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <header className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>The ‘{toolName}’ tool crashed</h2>
        </header>

        <div className={styles.cardContent}>
          <div>
            <Button onClick={onRetry}>Retry</Button>
          </div>
          <div>
            <Button onClick={onShowDetails} disabled={showErrorDetails}>
              Show details
            </Button>
          </div>
        </div>
      </div>

      {showErrorDetails && (
        <>
          <div className={styles.stack}>
            <h3>Stack trace:</h3>
            <pre>{formatStack(limitStackLength(getErrorWithStack(error)))}</pre>
          </div>

          <div className={styles.stack}>
            <h3>Component stack:</h3>
            <pre>{info.componentStack.replace(/^\s*\n+/, '')}</pre>
          </div>
        </>
      )}
    </div>
  )
}

export default ErrorScreen
