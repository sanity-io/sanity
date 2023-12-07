import type {ClientPerspective, MutationEvent, SanityClient} from '@sanity/client'
import {
  type Dispatch,
  type SetStateAction,
  type MutableRefObject,
  createContext,
  useContext,
} from 'react'
import type {LocalStorageish} from '../util/localStorage'

interface VisionStore {
  datasets: string[]
  dataset: string
  setDataset: Dispatch<SetStateAction<string>>
  apiVersion: string
  setApiVersion: Dispatch<SetStateAction<string>>
  perspective: ClientPerspective
  setPerspective: Dispatch<SetStateAction<ClientPerspective>>
  customApiVersion: string | false
  setCustomApiVersion: Dispatch<SetStateAction<string | false>>
  queryUrl?: string
  setQueryUrl: Dispatch<SetStateAction<string | undefined>>
  query: MutableRefObject<string>
  rawParams: string
  setRawParams: Dispatch<SetStateAction<string>>
  params?: Record<string, unknown> | Error
  paramsError?: string
  queryResult?: unknown
  setQueryResult: Dispatch<SetStateAction<unknown | undefined>>
  listenMutations: MutationEvent[]
  setListenMutations: Dispatch<SetStateAction<MutationEvent[]>>
  error?: Error
  setError: Dispatch<SetStateAction<Error | undefined>>
  queryTime?: number
  setQueryTime: Dispatch<SetStateAction<number | undefined>>
  e2eTime?: number
  setE2ETime: Dispatch<SetStateAction<number | undefined>>
  queryInProgress: boolean
  setQueryInProgress: Dispatch<SetStateAction<boolean>>
  listenInProgress: boolean
  setListenInProgress: Dispatch<SetStateAction<boolean>>
  client: SanityClient
  localStorage: LocalStorageish
}

export const VisionStoreContext = createContext<VisionStore | null>(null)

export function useVisionStore() {
  const store = useContext(VisionStoreContext)
  if (!store) {
    throw new Error('useVisionStore() must be used within a VisionStoreContext')
  }
  return store
}
