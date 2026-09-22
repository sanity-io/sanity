import {Suspense, use} from 'react'
import {type ObservablePromise} from 'react-rx'
import {useClient} from 'sanity'
import {Flex} from 'ui5'

import {DelayedSpinner} from '../components/DelayedSpinner'
import {useDatasets} from '../hooks/useDatasets'
import {type VisionProps} from '../types'
import {VistaGui} from './components/VistaGui'

export function VistaContainer(props: VisionProps) {
  const datasetsClient = useClient({apiVersion: 'v2025-06-27'})
  const datasetsPromise = useDatasets({client: datasetsClient, datasets: props.config.datasets})

  return (
    <Suspense
      fallback={
        <Flex alignItems="center" height="100%" justifyContent="center">
          <DelayedSpinner />
        </Flex>
      }
    >
      <LoadedVistaContainer {...props} datasetsPromise={datasetsPromise} />
    </Suspense>
  )
}

function LoadedVistaContainer({
  datasetsPromise,
  ...props
}: VisionProps & {datasetsPromise: ObservablePromise<string[] | Error>}) {
  const loadedDatasets = use(datasetsPromise)

  const datasets =
    loadedDatasets instanceof Error
      ? // On error, use the clients configured dataset
        [props.client.config().dataset || 'production']
      : loadedDatasets

  const projectId = props.client.config().projectId || 'default'
  const defaultDataset = props.config.defaultDataset || props.client.config().dataset || datasets[0]

  return (
    <VistaGui
      key={projectId}
      config={props.config}
      datasets={datasets}
      projectId={projectId}
      defaultDataset={defaultDataset}
    />
  )
}
