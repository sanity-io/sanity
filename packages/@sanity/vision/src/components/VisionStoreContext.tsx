import type {ClientPerspective, MutationEvent, SanityClient} from '@sanity/client'
import {type Dispatch, type SetStateAction, createContext, useContext} from 'react'
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
  query: string
  rawParams: string
  params?: Record<string, unknown> | Error
  paramsError?: string
  queryResult?: unknown
  listenMutations: MutationEvent[]
  error?: Error
  queryTime?: number
  e2eTime?: number
  queryInProgress: boolean
  listenInProgress: boolean
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
