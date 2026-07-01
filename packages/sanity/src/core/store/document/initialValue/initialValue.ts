import {type InitialValueResolverContext, type SanityDocumentLike, type Schema} from '@sanity/types'
import {from, merge, type Observable, of} from 'rxjs'
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  scan,
  startWith,
  switchMap,
  timeout,
} from 'rxjs/operators'

import {type DocumentPreviewStore} from '../../../preview'
import {
  RESOLVE_INITIAL_VALUE_TIMEOUT_MS,
  resolveInitialValue,
  type Template,
} from '../../../templates'
import {getDraftId, getPublishedId} from '../../../util'
import {
  type InitialValueErrorMsg,
  type InitialValueLoadingMsg,
  type InitialValueMsg,
  type InitialValueSuccessMsg,
} from './types'

/**
 * @hidden
 * @beta */
export interface InitialValueOptions {
  documentId: string
  documentType: string
  templateName?: string
  templateParams?: Record<string, any>
}

const LOADING_MSG: InitialValueLoadingMsg = {type: 'loading'}

/**
 * @internal
 */
export function getInitialValueStream(
  schema: Schema,
  initialValueTemplates: Template[],
  documentPreviewStore: DocumentPreviewStore,
  opts: InitialValueOptions,
  context: InitialValueResolverContext,
): Observable<InitialValueMsg> {
  const draft$ = documentPreviewStore.observePaths(
    {_type: 'reference', _ref: getDraftId(opts.documentId)},
    ['_type'],
  )

  const published$ = documentPreviewStore.observePaths(
    {_type: 'reference', _ref: getPublishedId(opts.documentId)},
    ['_type'],
  )

  const value$ = merge(
    draft$.pipe(map((draft) => ({draft}))),
    published$.pipe(map((published) => ({published}))),
  ).pipe(
    scan((prev, res) => ({...prev, ...res}), {}),
    // Wait until we know the state of both draft and published
    filter((res) => 'draft' in res && 'published' in res),
    map((res: any) => res.draft || res.published),
    // Only update if we didn't previously have a document but we now do
    distinctUntilChanged((prev, next) => Boolean(prev) !== Boolean(next)),
    // Prevent rapid re-resolving when transitioning between different templates
    debounceTime(25),
  )

  return value$.pipe(
    switchMap((document): Observable<InitialValueMsg> => {
      // Already exists, so no initial value is needed
      if (document) {
        return of({type: 'success', value: null})
      }

      if (!opts.templateName) {
        // @todo: Make sure this is the correct behavior
        return of({type: 'success', value: null})
      }

      const template = initialValueTemplates.find((t) => t.id === opts.templateName)

      if (!template) {
        console.warn('Template "%s" not defined, using empty initial value', opts.templateName)
        return of({type: 'success', value: null})
      }

      const resolved$ = from(
        resolveInitialValue(schema, template, opts.templateParams, context),
      ).pipe(
        // A resolver whose request is parked (network/CORS) never settles —
        // time it out so the failure surfaces rather than hanging the editor.
        timeout({first: RESOLVE_INITIAL_VALUE_TIMEOUT_MS}),
        map(
          (initialValue): InitialValueSuccessMsg => ({
            type: 'success',
            // The resolver returns an arbitrary record; by contract it's a
            // document-like value (the template's `_type` was merged in).
            value: initialValue as SanityDocumentLike,
          }),
        ),
        catchError((resolveError: Error) => {
          // oxlint-disable no-console
          console.group('Failed to resolve initial value')
          console.error(resolveError)
          console.error('Template ID: %s', opts.templateName)
          console.error('Parameters: %o', opts.templateParams)
          console.groupEnd()
          // oxlint-enable no-console

          // Carry the original error so the consumer can classify it
          // (a network/5xx failure in a resolver's `client.fetch` is
          // delegated to the studio's request-error dialog) and re-throwing
          // resolver bugs stay caller-domain.
          const msg: InitialValueErrorMsg = {type: 'error', error: resolveError}
          return of(msg)
        }),
      )

      return merge(of<InitialValueMsg>(LOADING_MSG), resolved$)
    }),

    startWith(LOADING_MSG),
    distinctUntilChanged(),
  )
}
