import {Flex} from '@sanity/ui'
import {Suspense, use} from 'react'
import {type ObservablePromise} from 'react-rx'
import {useClient} from 'sanity'

import {DelayedSpinner} from '../components/DelayedSpinner'
import {VisionGui} from '../components/VisionGui'
import {useDatasets} from '../hooks/useDatasets'
import {type VisionProps} from '../types'

export function VisionContainer(props: VisionProps) {
  const datasetsClient = useClient({apiVersion: 'v2025-06-27'})
  const datasetsPromise = useDatasets({client: datasetsClient, datasets: props.config.datasets})

  return (
    <Suspense
      fallback={
        <Flex align="center" height="fill" justify="center">
          <DelayedSpinner />
        </Flex>
      }
    >
      <LoadedVisionContainer {...props} datasetsPromise={datasetsPromise} />
    </Suspense>
  )
}

function LoadedVisionContainer({
  datasetsPromise,
  ...props
}: VisionProps & {datasetsPromise: ObservablePromise<string[] | Error>}) {
  const loadedDatasets = use(datasetsPromise)

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
