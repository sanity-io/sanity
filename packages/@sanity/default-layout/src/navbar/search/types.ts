export interface SearchHit {
  _id: string
  _type: string
  resultIndex: number
  hit: {_id: string; _type: string}
}

export interface SearchState {
  hits: SearchHit[]
  loading: boolean
  error: Error | null
  searchString: string
}
