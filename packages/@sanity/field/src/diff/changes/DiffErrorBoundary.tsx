import * as React from 'react'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import styles from './ValueError.css'

declare const __DEV__: boolean

interface BoundaryProps {
  children: React.ReactNode
}

interface BoundaryState {
  error?: Error
}

export class DiffErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props)
    this.state = {error: undefined}
  }

  static getDerivedStateFromError(error) {
    return {error}
  }

  // eslint-disable-next-line class-methods-use-this
  componentDidCatch(error: Error) {
    /* eslint-disable no-console */
    console.error('Error rendering diff component: ')
    console.error(error)
    /* eslint-enable no-console */
  }

  render() {
    const isDev = __DEV__ === true
    const {error} = this.state
    if (!error) {
      return this.props.children
    }

    const help = isDev ? <p>Check the developer console for more information.</p> : null
    return (
      <>
        <div className={styles.root}>
          <span className={styles.icon}>
            <ErrorOutlineIcon />
          </span>
          <div className={styles.message}>
            The component responsible for showing the changes to this field has crashed.
            {help}
          </div>
        </div>
      </>
    )
  }
}
