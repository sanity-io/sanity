import {DelayedSpinner} from '../components/DelayedSpinner'
import {VisionGui} from '../components/VisionGui'
import {VisionStoreProvider} from '../components/VisionStoreProvider'
import {useDatasets} from '../hooks'
import type {VisionProps} from '../types'

export function VisionContainer(props: VisionProps) {
  const loadedDatasets = useDatasets(props.client)

  if (!loadedDatasets) {
    return <DelayedSpinner />
  }

  const datasets =
    loadedDatasets instanceof Error
      ? // On error, use the clients configured dataset
        [props.client.config().dataset || 'production']
      : // Otherwise use the loaded list, obviously
        loadedDatasets

  return (
    <VisionStoreProvider {...props} datasets={datasets}>
      <VisionGui />
    </VisionStoreProvider>
  )
}
