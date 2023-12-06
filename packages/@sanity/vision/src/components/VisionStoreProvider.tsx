import {useMemo, type ReactNode, useState} from 'react'
import type {ClientPerspective} from '@sanity/client'
import {getLocalStorage} from '../util/localStorage'
import {VisionProps} from '../types'
import {API_VERSIONS, DEFAULT_API_VERSION} from '../apiVersions'
import {DEFAULT_PERSPECTIVE, PERSPECTIVES} from '../perspectives'
import {prefixApiVersion} from '../util/prefixApiVersion'
import {VisionStoreContext} from './VisionStoreContext'

export interface VisionStoreProviderProps extends VisionProps {
  children: ReactNode
  datasets: string[]
}

export function VisionStoreProvider(props: VisionStoreProviderProps) {
  const {children, client, config, datasets} = props
  const localStorage = useMemo(
    () => getLocalStorage(client.config().projectId || 'default'),
    [client],
  )

  const [dataset, setDataset] = useState(() =>
    localStorage.get('dataset', config.defaultDataset || client.config().dataset || datasets[0]),
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

  const _client = useMemo(() => {
    return client.withConfig({
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
      client: _client,
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
    }),
    [_client, apiVersion, customApiVersion, dataset, datasets, localStorage, perspective],
  )

  // console.log(value)

  return <VisionStoreContext.Provider value={value}>{children}</VisionStoreContext.Provider>
}
