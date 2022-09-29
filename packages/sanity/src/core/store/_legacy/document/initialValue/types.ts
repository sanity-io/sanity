import {SanityDocumentLike} from '@sanity/types'

/** @beta */
export interface InitialValueLoadingMsg {
  type: 'loading'
}

/** @beta */
export interface InitialValueSuccessMsg {
  type: 'success'
  value: SanityDocumentLike | null
}

/** @beta */
export interface InitialValueErrorMsg {
  type: 'error'
  error: Error
}

/** @beta */
export type InitialValueMsg = InitialValueLoadingMsg | InitialValueSuccessMsg | InitialValueErrorMsg

/** @internal */
export interface InitialValueState {
  loading: boolean
  error: Error | null
  value: SanityDocumentLike
}
