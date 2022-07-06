import type {SearchParams} from '@sanity/base'

export interface SearchHit {
  _id: string
  _type: string
  resultIndex: number
  hit: {_id: string; _type: string}
}

export interface SearchState extends SearchParams {
  hits: SearchHit[]
  loading: boolean
  error: Error | null
}
