import {SanityDocumentLike} from '@sanity/types'

export interface InitialValueLoadingMsg {
  type: 'loading'
}

export interface InitialValueSuccessMsg {
  type: 'success'
  value: SanityDocumentLike | null
}

export interface InitialValueErrorMsg {
  type: 'error'
  error: Error
}

export type InitialValueMsg = InitialValueLoadingMsg | InitialValueSuccessMsg | InitialValueErrorMsg

export interface InitialValueState {
  loading: boolean
  error: Error | null
  value: SanityDocumentLike
}
