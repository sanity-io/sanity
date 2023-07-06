import {InitialValueResolverContext, Schema} from '@sanity/types'
import {from, merge, Observable, of} from 'rxjs'
import {
  map,
  switchMap,
  scan,
  filter,
  distinctUntilChanged,
  catchError,
  debounceTime,
  startWith,
} from 'rxjs/operators'
import {DocumentPreviewStore} from '../../../../preview'
import {resolveInitialValue, Template} from '../../../../templates'
import {getDraftId, getPublishedId} from '../../../../util'
import {
  InitialValueErrorMsg,
  InitialValueLoadingMsg,
  InitialValueSuccessMsg,
  InitialValueMsg,
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
  context: InitialValueResolverContext
): Observable<InitialValueMsg> {
  const draft$ = documentPreviewStore.observePaths(
    {_type: 'reference', _ref: getDraftId(opts.documentId)},
    ['_type']
  )

  const published$ = documentPreviewStore.observePaths(
    {_type: 'reference', _ref: getPublishedId(opts.documentId)},
    ['_type']
  )

  const value$ = merge(
    draft$.pipe(map((draft) => ({draft}))),
    published$.pipe(map((published) => ({published})))
  ).pipe(
    scan((prev, res) => ({...prev, ...res}), {}),
    // Wait until we know the state of both draft and published
    filter((res) => 'draft' in res && 'published' in res),
    map((res: any) => res.draft || res.published),
    // Only update if we didn't previously have a document but we now do
    distinctUntilChanged((prev, next) => Boolean(prev) !== Boolean(next)),
    // Prevent rapid re-resolving when transitioning between different templates
    debounceTime(25)
  )

  return value$.pipe(
    switchMap((document) => {
      // Already exists, so no initial value is needed
      if (document) {
        return of({type: 'success', value: null})
      }

      if (!opts.templateName) {
        // @todo: Make sure this is the correct behavior
        return of({isResolving: false, initialValue: undefined})
      }

      const template = initialValueTemplates.find((t) => t.id === opts.templateName)

      if (!template) {
        // eslint-disable-next-line no-console
        console.warn('Template "%s" not defined, using empty initial value', opts.templateName)
        return of({isResolving: false, initialValue: undefined})
      }

      const initialValueWithParams$ = from(
        resolveInitialValue(schema, template, opts.templateParams, context)
      )
        .pipe(map((initialValue) => ({isResolving: false, initialValue})))
        .pipe(
          catchError((resolveError) => {
            /* eslint-disable no-console */
            console.group('Failed to resolve initial value')
            console.error(resolveError)
            console.error('Template ID: %s', opts.templateName)
            console.error('Parameters: %o', opts.templateParams)
            console.groupEnd()
            /* eslint-enable no-console */

            const msg: InitialValueErrorMsg = {type: 'error', error: resolveError}

            return of(msg)
          })
        )

      return merge(of({isResolving: true}), initialValueWithParams$).pipe(
        switchMap(({isResolving, initialValue, resolveError}: any) => {
          if (resolveError) {
            return of({type: 'error', message: 'Failed to resolve initial value'})
          }

          if (isResolving) {
            return of(LOADING_MSG)
          }

          const msg: InitialValueSuccessMsg = {type: 'success', value: initialValue}

          return of(msg)
        })
      )
    }),

    startWith(LOADING_MSG),
    distinctUntilChanged()
  ) as Observable<InitialValueMsg>
}
