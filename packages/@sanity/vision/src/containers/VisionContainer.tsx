import {Flex} from '@sanity/ui'
import {useClient} from 'sanity'

import {DelayedSpinner} from '../components/DelayedSpinner'
import {VisionGui} from '../components/VisionGui'
import {useDatasets} from '../hooks/useDatasets'
import {type VisionProps} from '../types'

export function VisionContainer(props: VisionProps) {
  const datasetsClient = useClient({apiVersion: 'v2025-06-27'})
  const loadedDatasets = useDatasets({client: datasetsClient, datasets: props.config.datasets})

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
      key={projectId}
      {...props}
      datasets={datasets}
      projectId={projectId}
      defaultDataset={defaultDataset}
    />
  )
}
