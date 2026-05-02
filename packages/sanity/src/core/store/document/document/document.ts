import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type Schema} from '@sanity/types'
import {of, type Observable, type ObservableInput} from 'rxjs'
import {shareReplay, switchMap} from 'rxjs/operators'

import {type SourceClientOptions} from '../../../config'
import {type LocaleSource} from '../../../i18n'
import {type DraftsModelDocumentAvailability} from '../../../preview'
import {type ValidationStatus} from '../../../validation'
import {memoize} from '../utils/createMemoizer'
import {documentValidation} from './documentValidation'
import {resolveTarget} from './resolveDocumentTarget'
import {type DocumentTarget} from './types'
import {getTargetKey} from './utils'

/** @internal */
export interface DocumentStoreDocument {
  resolve: (target: DocumentTarget) => Observable<string>
  validation: (
    target: DocumentTarget,
    validatePublishedReferences: boolean,
  ) => Observable<ValidationStatus>
}

export interface DocumentContext {
  client: SanityClient
  getClient: (options: SourceClientOptions) => SanityClient
  // TODO: Do we need to refactor this to use the new document ids model?
  observeDocumentPairAvailability: (id: string) => Observable<DraftsModelDocumentAvailability>
  schema: Schema
  i18n: LocaleSource
  // extraOptions?: DocumentStoreExtraOptions
  currentUser?: Omit<CurrentUser, 'role'> | null
}

// Memoized counterpart to `getIdPairFromPublished`: resolves one selected target to the
// concrete document id every document-scoped store method should share.
const resolveDocumentTarget = memoize((target: DocumentTarget): Observable<string> => {
  return of(resolveTarget(target)).pipe(shareReplay({bufferSize: 1, refCount: true}))
}, getTargetKey)

// Keeps document-scoped methods from repeating the same resolve-then-switchMap wrapper.
const withResolvedTarget =
  <Result>(fn: (resolved: string) => ObservableInput<Result>) =>
  (target: DocumentTarget): Observable<Result> =>
    resolveDocumentTarget(target).pipe(switchMap(fn))

/** @internal */
// Single-document facade that mirrors `documentStore.pair`, but starts from an explicit target
// and resolves it to one concrete document before calling the underlying document pipelines.
export function createDocumentStoreDocument(ctx: DocumentContext): DocumentStoreDocument {
  return {
    resolve(target) {
      return resolveDocumentTarget(target)
    },
    validation(target, validatePublishedReferences) {
      return withResolvedTarget((resolved) =>
        documentValidation(resolved, validatePublishedReferences, ctx),
      )(target)
    },
  }
}
