import {SanityDocument} from '@sanity/types'

export interface InitialValueState {
  loading: boolean
  error: Error | null
  value: Partial<SanityDocument>
}
