import {useMemo, type ReactNode, useState, useRef} from 'react'
import type {ClientPerspective, MutationEvent} from '@sanity/client'
import {getLocalStorage} from '../util/localStorage'
import type {VisionProps} from '../types'
import {API_VERSIONS, DEFAULT_API_VERSION} from '../apiVersions'
import {DEFAULT_PERSPECTIVE, PERSPECTIVES} from '../perspectives'
import {prefixApiVersion} from '../util/prefixApiVersion'
import {VisionStoreContext} from './VisionStoreContext'

export interface VisionStoreProviderProps extends VisionProps {
  children: ReactNode
  datasets: string[]
}

export function VisionStoreProvider(props: VisionStoreProviderProps) {
  const {children, client: sanityClient, config, datasets} = props
  const localStorage = useMemo(
    () => getLocalStorage(sanityClient.config().projectId || 'default'),
    [sanityClient],
  )

  const [dataset, setDataset] = useState(() =>
    localStorage.get(
      'dataset',
      config.defaultDataset || sanityClient.config().dataset || datasets[0],
    ),
  )
  const [apiVersion, setApiVersion] = useState(() =>
    localStorage.get('apiVersion', prefixApiVersion(`${config.defaultApiVersion}`)),
  )
  const [perspective, setPerspective] = useState<ClientPerspective>(() =>
    localStorage.get('perspective', DEFAULT_PERSPECTIVE),
  )
  const [customApiVersion, setCustomApiVersion] = useState<string | false>(() =>
    API_VERSIONS.includes(apiVersion) ? false : apiVersion,
  )
  const [queryUrl, setQueryUrl] = useState<string | undefined>()
  const query = useRef(localStorage.get('query', ''))
  const [rawParams, setRawParams] = useState<string>(() => localStorage.get('params', '{\n  \n}'))

  // Query/listen result
  const [queryResult, setQueryResult] = useState<unknown | undefined>()
  const [listenMutations, setListenMutations] = useState<MutationEvent[]>([])
  const [error, setError] = useState<Error | undefined>()

  // Operation timings
  const [queryTime, setQueryTime] = useState<number | undefined>()
  const [e2eTime, setE2ETime] = useState<number | undefined>()

  // Operation state, used to trigger re-renders (spinners etc)
  const [queryInProgress, setQueryInProgress] = useState(false)
  const [listenInProgress, setListenInProgress] = useState(false)

  const client = useMemo(() => {
    return sanityClient.withConfig({
      apiVersion: API_VERSIONS.includes(apiVersion) ? apiVersion : DEFAULT_API_VERSION,
      dataset: datasets.includes(dataset) ? dataset : datasets[0],
      perspective: PERSPECTIVES.includes(perspective) ? perspective : DEFAULT_PERSPECTIVE,
      allowReconfigure: true,
    })
    // Configure the client with defaults since every change updates the client
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({
      datasets,
      client,
      localStorage,

      // Selected options
      dataset,
      setDataset,
      apiVersion,
      setApiVersion,
      perspective,
      setPerspective,
      customApiVersion,
      setCustomApiVersion,

      // URL used to execute query/listener
      queryUrl,
      setQueryUrl,

      // Inputs
      query,
      rawParams,
      setRawParams,

      // Operation timings
      queryTime,
      setQueryTime,
      e2eTime,
      setE2ETime,

      // Query/listen result
      queryResult,
      setQueryResult,
      listenMutations,
      setListenMutations,
      error,
      setError,

      // Operation state, used to trigger re-renders (spinners etc)
      queryInProgress,
      setQueryInProgress,
      listenInProgress,
      setListenInProgress,
    }),
    [
      apiVersion,
      client,
      customApiVersion,
      dataset,
      datasets,
      e2eTime,
      error,
      listenInProgress,
      listenMutations,
      localStorage,
      perspective,
      queryInProgress,
      queryResult,
      queryTime,
      queryUrl,
      rawParams,
    ],
  )

  // console.log(value)

  return <VisionStoreContext.Provider value={value}>{children}</VisionStoreContext.Provider>
}
