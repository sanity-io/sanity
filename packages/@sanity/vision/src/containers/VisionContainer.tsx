import {Flex} from '@sanity/ui'

import {DelayedSpinner} from '../components/DelayedSpinner'
import {VisionGui} from '../components/VisionGui'
import {useDatasets} from '../hooks/useDatasets'
import {type VisionProps} from '../types'

export function VisionContainer(props: VisionProps) {
  const loadedDatasets = useDatasets(props.client)

  if (!loadedDatasets) {
    return (
      <Flex align="center" height="fill" justify="center">
        <DelayedSpinner />
      </Flex>
    )
  }

  const datasets =
    loadedDatasets instanceof Error
      ? // On error, use the clients configured dataset
        [props.client.config().dataset || 'production']
      : // Otherwise use the loaded list, obviously
        loadedDatasets

  const projectId = props.client.config().projectId
  const defaultDataset = props.config.defaultDataset || props.client.config().dataset || datasets[0]

  return (
    <VisionGui
      {...props}
      key={projectId}
      datasets={datasets}
      projectId={projectId}
      defaultDataset={defaultDataset}
    />
  )
}
