import {SanityDocumentLike} from '@sanity/types'

/**
 * @hidden
 * @beta */
export interface InitialValueLoadingMsg {
  type: 'loading'
}

/**
 * @hidden
 * @beta */
export interface InitialValueSuccessMsg {
  type: 'success'
  value: SanityDocumentLike | null
}

/**
 * @hidden
 * @beta */
export interface InitialValueErrorMsg {
  type: 'error'
  error: Error
}

/**
 * @hidden
 * @beta */
export type InitialValueMsg = InitialValueLoadingMsg | InitialValueSuccessMsg | InitialValueErrorMsg

/** @internal */
export interface InitialValueState {
  loading: boolean
  error: Error | null
  value: SanityDocumentLike
}
