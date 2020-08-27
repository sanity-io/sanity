import * as React from 'react'

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
    if (error) {
      const help = isDev ? <p>Check the developer console for more information.</p> : null
      return (
        <div>
          <h2>Error</h2>
          <p>The component responsible for showing the changes of this field crashed.</p>
          {help}
        </div>
      )
    }

    return this.props.children
  }
}
