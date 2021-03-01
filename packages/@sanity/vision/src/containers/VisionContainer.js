import React from 'react'
import DelayedSpinner from '../components/DelayedSpinner'
import ErrorDialog from '../components/ErrorDialog'
import VisionGui from '../components/VisionGui'
import LoadingContainer from './LoadingContainer'

// Loads the most basic data from a Sanity project
class VisionContainer extends LoadingContainer {
  getSubscriptions() {
    return {
      datasets: {uri: '/datasets'},
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
