import {Component, type ReactNode} from 'react'

import {createRetryableLazy} from '../../../util/createRetryableLazy'

// The diff (`@pierre/diffs` and Shiki) only loads once a diff is shown, and a failed load can be
// retried from the boundary
const codeDiff = createRetryableLazy(() => import('./CodeDiff'))

export const CodeDiffLoader = codeDiff.Component

interface DiffBoundaryProps {
  children: ReactNode
  renderFallback: (retry: () => void) => ReactNode
}

/** Catches a diff that failed to load or render, and offers to load it again */
export class DiffBoundary extends Component<DiffBoundaryProps, {failed: boolean}> {
  state = {failed: false}

  static getDerivedStateFromError() {
    return {failed: true}
  }

  retry = () => {
    codeDiff.retry()
    this.setState({failed: false})
  }

  render() {
    return this.state.failed ? this.props.renderFallback(this.retry) : this.props.children
  }
}
