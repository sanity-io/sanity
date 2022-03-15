import {SanityDocument} from '@sanity/types'

export interface InitialValueLoadingMsg {
  type: 'loading'
}

export interface InitialValueSuccessMsg {
  type: 'success'
  value: Partial<SanityDocument> | null
}

export interface InitialValueErrorMsg {
  type: 'error'
  error: Error
}

export type InitialValueMsg = InitialValueLoadingMsg | InitialValueSuccessMsg | InitialValueErrorMsg

export interface InitialValueState {
  loading: boolean
  error: Error | null
  value: Partial<SanityDocument>
}
