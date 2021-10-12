/* eslint-disable max-nested-callbacks */

// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {
  templateExists,
  getTemplateById,
  getTemplatesBySchemaType,
  resolveInitialValue,
} from '@sanity/base/initial-value-templates'
import {SanityDocument} from '@sanity/types'
import {observePaths} from 'part:@sanity/base/preview'
import schema from 'part:@sanity/base/schema'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
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
import {DocumentPaneOptions} from '../types'

interface InitialValueOptions {
  documentId: string
  paneOptions: DocumentPaneOptions
  panePayload?: unknown
  urlTemplate?: string
}

const LOADING_MSG = {type: 'loading'} as const

interface InitialValueLoadingMsg {
  type: 'loading'
}

interface InitialValueSuccessMsg {
  type: 'success'
  value: Partial<SanityDocument> | null
}

interface InitialValueErrorMsg {
  type: 'error'
  error: Error
}

type InitialValueMsg = InitialValueLoadingMsg | InitialValueSuccessMsg | InitialValueErrorMsg

/**
 * @internal
 */
export function getInitialValueObservable(opts: InitialValueOptions): Observable<InitialValueMsg> {
  return merge(
    observePaths(getDraftId(opts.documentId), ['_type']).pipe(map((draft) => ({draft}))),
    observePaths(getPublishedId(opts.documentId), ['_type']).pipe(map((published) => ({published})))
  ).pipe(
    scan((prev, res) => ({...prev, ...res}), {}),
    // Wait until we know the state of both draft and published
    filter((res) => 'draft' in res && 'published' in res),
    map((res: any) => res.draft || res.published),
    // Only update if we didn't previously have a document but we now do
    distinctUntilChanged((prev, next) => Boolean(prev) !== Boolean(next)),
    // Prevent rapid re-resolving when transitioning between different templates
    debounceTime(25),
    switchMap((document) => {
      const {templateName, parameters} = getInitialValueProps(document || null, opts) || {}

      if (!templateName || !parameters) {
        const msg: InitialValueSuccessMsg = {type: 'success', value: null}

        return of(msg)
      }

      return merge(
        of({isResolving: true}),
        resolveInitialValueWithParameters(templateName, parameters).pipe(
          // @ts-expect-error NOTE: TypeScript fails for an unknown reason.
          catchError((resolveError) => {
            /* eslint-disable no-console */
            console.group('Failed to resolve initial value')
            console.error(resolveError)
            console.error('Template ID: %s', templateName)
            console.error('Parameters: %o', parameters || {})
            console.groupEnd()
            /* eslint-enable no-console */

            const msg: InitialValueErrorMsg = {type: 'error', error: resolveError}

            return of(msg)
          })
        )
      ).pipe(
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

/**
 * @internal
 */
function getInitialValueProps(
  document: SanityDocument | null,
  opts: InitialValueOptions
): {templateName: string; parameters: Record<string, unknown>} | null {
  if (document) {
    return null
  }

  const payload = opts.panePayload || {}
  const structureNodeTemplate = opts.paneOptions.template

  if (opts.urlTemplate && structureNodeTemplate && structureNodeTemplate !== opts.urlTemplate) {
    // eslint-disable-next-line no-console
    console.warn(
      `Conflicting templates: URL says "${opts.urlTemplate}", structure node says "${structureNodeTemplate}". Using "${structureNodeTemplate}".`
    )
  }

  const template = structureNodeTemplate || opts.urlTemplate
  const typeTemplates = getTemplatesBySchemaType(opts.paneOptions.type)

  const parameters = {
    ...opts.paneOptions.templateParameters,
    ...(typeof payload === 'object' ? payload || {} : {}),
  }

  let templateName = template

  // If we have not specified a specific template, and we only have a single
  // template available for a schema type, use it
  if (!template && typeTemplates.length === 1) {
    templateName = typeTemplates[0].id
  }

  return {templateName: templateName!, parameters}
}

/**
 * @internal
 */
function resolveInitialValueWithParameters(
  templateName: string,
  parameters: Record<string, unknown>
) {
  if (!templateExists(templateName)) {
    // eslint-disable-next-line no-console
    console.warn('Template "%s" not defined, using empty initial value', templateName)
    return of({isResolving: false, initialValue: undefined})
  }

  const tpl = getTemplateById(templateName)

  return from(resolveInitialValue(schema, tpl!, parameters)).pipe(
    map((initialValue) => ({isResolving: false, initialValue}))
  )
}
