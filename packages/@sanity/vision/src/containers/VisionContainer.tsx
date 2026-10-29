import {Fragment, type ReactNode, Suspense, use} from 'react'
import {type ObservablePromise} from 'react-rx'
import {useClient} from 'sanity'
import {Flex} from 'ui5'

import {DelayedSpinner} from '../components/DelayedSpinner'
import {useDatasets} from '../hooks/useDatasets'
import {type VisionProps} from '../types'

/** What both Vision experiences need to know about the project before they can render */
export interface LoadedVisionProps {
  datasets: string[]
  projectId: string
  defaultDataset: string
}

export interface VisionContainerProps extends VisionProps {
  /** Rendered once the datasets are known, and remounted when the project changes */
  children: (loaded: LoadedVisionProps) => ReactNode
}

export function VisionContainer(props: VisionContainerProps) {
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
      <LoadedVisionContainer {...props} datasetsPromise={datasetsPromise} />
    </Suspense>
  )
}

function LoadedVisionContainer({
  children,
  client,
  config,
  datasetsPromise,
}: VisionContainerProps & {datasetsPromise: ObservablePromise<string[] | Error>}) {
  const loadedDatasets = use(datasetsPromise)
  const clientConfig = client.config()

  const datasets =
    loadedDatasets instanceof Error
      ? // On error, use the clients configured dataset
        [clientConfig.dataset || 'production']
      : // Otherwise use the loaded list, obviously
        loadedDatasets

  const projectId = clientConfig.projectId || 'default'
  const defaultDataset = config.defaultDataset || clientConfig.dataset || datasets[0]

  return <Fragment key={projectId}>{children({datasets, projectId, defaultDataset})}</Fragment>
}
