import React from 'react'
import DelayedSpinner from '../components/DelayedSpinner'
import VisionGui from '../components/VisionGui'
import LoadingContainer from './LoadingContainer'

export interface VisionContainerProps {
  styles: {visionGui: Record<string, string>}
}

export interface VisionContainerState {
  datasets: {name: string}[]
  error?: Error
  state?: Error
}

// Loads the most basic data from a Sanity project
class VisionContainer extends LoadingContainer<VisionContainerProps, VisionContainerState> {
  super(props: VisionContainerProps) {
    this.super(props)
    this.getSubscriptions = () => {
      return {
        datasets: {uri: '/datasets'},
      }
    }
  }

  render() {
    const datasets = this.state.datasets || []

    if (this.state.error) {
      const defaultDataset = this.context.client.config().dataset
      datasets[0] = {name: defaultDataset}
    } else if (!this.hasAllData()) {
      return <DelayedSpinner />
    }

    return <VisionGui {...this.state} {...this.props} datasets={datasets} />
  }
}

export default VisionContainer
