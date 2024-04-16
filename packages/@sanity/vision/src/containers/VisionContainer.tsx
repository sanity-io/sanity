import {type ClientPerspective} from '@sanity/client'
import {useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useTranslation} from 'sanity'
import {useRouter} from 'sanity/router'

import {DEFAULT_API_VERSION} from '../apiVersions'
import {DelayedSpinner} from '../components/DelayedSpinner'
import {VisionGui} from '../components/VisionGui'
import {useDatasets} from '../hooks/useDatasets'
import {visionLocaleNamespace} from '../i18n'
import {DEFAULT_PERSPECTIVE, PERSPECTIVES} from '../perspectives'
import {type VisionProps} from '../types'
import {getLocalStorage} from '../util/localStorage'
import {prefixApiVersion} from '../util/prefixApiVersion'
import {validateApiVersion} from '../util/validateApiVersion'

export function VisionContainer(props: VisionProps) {
  const toast = useToast()
  const loadedDatasets = useDatasets(props.client)
  const {t} = useTranslation(visionLocaleNamespace)
  const _localStorage = useMemo(
    () => getLocalStorage(props.client.config().projectId || 'default'),
    [props.client],
  )
  const router = useRouter()
  const searchParams = useMemo(
    () => new URLSearchParams(router.state._searchParams),
    [router.state._searchParams],
  )
  const searchParamsAsString = useMemo(
    () => new URLSearchParams(router.state._searchParams).toString(),
    [router.state._searchParams],
  )
  const nextSearchParams = useRef<URLSearchParams>()
  if (!nextSearchParams.current) {
    nextSearchParams.current = new URLSearchParams()
  }
  const [shouldNavigate, setShouldNavigate] = useState(false)
  const setPersistedState = useCallback(
    (key: string, value: string) => {
      nextSearchParams.current!.set(key, value)
      _localStorage.set(key, value)
      setShouldNavigate(true)
    },
    [_localStorage],
  )

  useEffect(() => {
    if (shouldNavigate && nextSearchParams.current) {
      setShouldNavigate(false)
      const finalSearchParams = new URLSearchParams(searchParamsAsString)
      for (const [key, value] of nextSearchParams.current.entries()) {
        finalSearchParams.set(key, value)
        nextSearchParams.current.delete(key)
      }
      router.navigate({_searchParams: [...finalSearchParams.entries()]}, {replace: true})
    }
  }, [router, searchParamsAsString, shouldNavigate])

  // Set up defaults
  const datasets = useMemo(
    () =>
      !loadedDatasets || loadedDatasets instanceof Error
        ? // On error, use the clients configured dataset
          [props.client.config().dataset || 'production']
        : // Otherwise use the loaded list, obviously
          loadedDatasets,
    [loadedDatasets, props.client],
  )
  const defaultDataset = useMemo(
    () => props.config.defaultDataset || props.client.config().dataset || datasets[0],
    [datasets, props.client, props.config.defaultDataset],
  )
  const defaultApiVersion = useMemo(
    () =>
      props.config.defaultApiVersion
        ? prefixApiVersion(`${props.config.defaultApiVersion}`)
        : DEFAULT_API_VERSION,
    [props.config.defaultApiVersion],
  )

  // Load up persisted state (URL Search Params or localStorage)
  const dataset = useMemo(() => {
    const unsafeDataset =
      searchParams.get('dataset') || _localStorage.get('dataset', defaultDataset)
    if (datasets.includes(unsafeDataset)) {
      return unsafeDataset
    }
    if (datasets.includes(defaultDataset)) {
      return defaultDataset
    }
    return datasets[0]
  }, [_localStorage, datasets, defaultDataset, searchParams])
  const perspective = useMemo<ClientPerspective>(() => {
    const unsafePerspective =
      searchParams.get('perspective') || _localStorage.get('perspective', DEFAULT_PERSPECTIVE)
    if (PERSPECTIVES.includes(unsafePerspective as unknown as ClientPerspective)) {
      return unsafePerspective as ClientPerspective
    }
    return DEFAULT_PERSPECTIVE
  }, [_localStorage, searchParams])
  const apiVersion = useMemo(() => {
    const unsafeApiVersion =
      searchParams.get('apiVersion') || _localStorage.get('apiVersion', defaultApiVersion)
    if (validateApiVersion(unsafeApiVersion)) {
      return unsafeApiVersion
    }
    return defaultApiVersion
  }, [_localStorage, defaultApiVersion, searchParams])
  const query = useMemo(
    () => searchParams.get('query') || _localStorage.get('query', ''),
    [_localStorage, searchParams],
  )
  const params = useMemo(
    () => searchParams.get('params') || _localStorage.get('params', '{\n  \n}'),
    [_localStorage, searchParams],
  )

  if (!loadedDatasets) {
    return <DelayedSpinner />
  }

  return (
    <VisionGui
      {...props}
      datasets={datasets}
      toast={toast}
      t={t}
      apiVersion={apiVersion}
      dataset={dataset}
      perspective={perspective}
      setPersistedState={setPersistedState}
      query={query}
      params={params}
    />
  )
}
