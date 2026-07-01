import {type InitialValueResolverContext, type Schema} from '@sanity/types'
import {useMemo} from 'react'
import {combineLatest, defer, from, type Observable, of} from 'rxjs'
import {catchError, map, mergeMap, switchMap, timeout, toArray} from 'rxjs/operators'

import {useSchema, useTemplates} from '../../hooks'
import {
  type InitialValueTemplateItem,
  RESOLVE_INITIAL_VALUE_TIMEOUT_MS,
  resolveInitialValue,
  type Template,
} from '../../templates'
import {
  createHookFromObservableFactory,
  getDraftId,
  getPublishedId,
  type PartialExcept,
} from '../../util'
import {useGrantsStore} from '../datastores'
import {useInitialValueResolverContext} from '../document'
import {getDocumentValuePermissions} from './documentValuePermissions'
import {type GrantsStore, type PermissionCheckResult} from './types'

/** @internal */
export interface TemplatePermissionsResult<TInitialValue = Record<string, unknown>>
  extends PermissionCheckResult, InitialValueTemplateItem {
  granted: boolean
  reason: string
  resolvedInitialValue: TInitialValue
  subtitle?: string
  template: Template
}

type Serializable<T> = {serialize(): T}

function serialize<T>(item: T | Serializable<T>): T {
  if (typeof item === 'object' && item !== null && 'serialize' in item) {
    return serialize(item.serialize())
  }

  return item
}

/** @internal */
export interface TemplatePermissionsOptions {
  grantsStore: GrantsStore
  schema: Schema
  templates: Template[]
  templateItems: InitialValueTemplateItem[]
  context: InitialValueResolverContext
}

/**
 * The observable version of `useTemplatePermissions`
 *
 * @internal
 */
export function getTemplatePermissions({
  grantsStore,
  templateItems,
  templates,
  schema,
  context,
}: TemplatePermissionsOptions): Observable<Array<TemplatePermissionsResult>> {
  if (!templateItems?.length) return of([])

  return defer(() => {
    // Resolve each template's initial value concurrently. Resolution must
    // not be allowed to block the whole menu: a single resolver can reject
    // (its `client.fetch` errored) or never settle at all — the studio's
    // request-error handling parks failed requests (network / CORS) so they
    // hang indefinitely. A per-item timeout backstops the hang case.
    //
    // On failure we keep the template (don't drop it) and fall back to an
    // empty initial value for the permission check. The template stays
    // creatable/clickable in the menus; the real resolution error is then
    // surfaced in the editor when the user navigates there (see
    // `useInitialValue`). This avoids a misleading "insufficient
    // permissions" state for what is really a resolution failure.
    return from(templateItems).pipe(
      mergeMap((item) => {
        const serializedItem = serialize(item)
        const template = templates.find((t) => t.id === serializedItem.templateId)

        if (!template) {
          throw new Error(`template not found: "${serializedItem.templateId}"`)
        }

        // Resolve in-stream (rather than `mergeMap(async …)`) so RxJS owns
        // the timeout timer and cancels the in-flight resolution when the
        // consumer tears down — e.g. the create-document menu closes while a
        // resolver is still hanging on a parked request.
        return from(
          resolveInitialValue(schema, template, serializedItem.parameters, context, {
            useCache: true,
          }),
        ).pipe(
          timeout({first: RESOLVE_INITIAL_VALUE_TIMEOUT_MS}),
          map((resolvedInitialValue) => ({item: serializedItem, template, resolvedInitialValue})),
          catchError((resolveError) => {
            console.error(
              `Failed to resolve initial value for template "${serializedItem.templateId}":`,
              resolveError,
            )
            // Fall back to an empty initial value so the template is still
            // offered; the editor surfaces the resolution error on navigate.
            return of({item: serializedItem, template, resolvedInitialValue: {}})
          }),
        )
      }),
      // Convert each resolved item into a permission check observable
      map(({item, template, resolvedInitialValue}) => {
        const schemaType = schema.get(template.schemaType)

        if (!schemaType) {
          throw new Error(`schema type not found: "${template.schemaType}"`)
        }

        const liveEdit = schemaType?.liveEdit
        const {initialDocumentId = 'dummy-id'} = item
        const documentId = liveEdit
          ? getPublishedId(initialDocumentId)
          : getDraftId(initialDocumentId)

        return getDocumentValuePermissions({
          grantsStore,
          permission: 'create',
          document: {
            _id: documentId,
            _type: schemaType.name,
            ...resolvedInitialValue,
          },
        }).pipe(
          map(
            ({granted, reason}): TemplatePermissionsResult => ({
              ...item,
              granted,
              reason,
              resolvedInitialValue,
              template,
              i18n: item.i18n || template.i18n,
              title: item.title || template.title,
              subtitle:
                schemaType.title === (item.title || template.title) ? undefined : schemaType.title,
              description: item.description || template.description,
              icon: item.icon || template.icon,
            }),
          ),
        )
      }),
      // Collect all permission check observables
      toArray(),
      // Switch to combined observable of all permission checks.
      // `combineLatest([])` completes without emitting, which would leave
      // the consumer's loading state stuck on forever — emit an empty
      // result instead when no templates resolved.
      switchMap((observables) =>
        observables.length ? combineLatest(observables) : of([] as TemplatePermissionsResult[]),
      ),
    )
  })
}

/**
 * Takes in an array of initial template values and returns an object of
 * `TemplatePermissionsResult` keyed by the IDs of the initial template values
 * given.
 *
 * The `TemplatePermissionsResult` is an object that contains a `granted`
 * boolean per key and can be used to determine if a user has the ability to
 * create documents using the given initial value template items.
 *
 * For each initial template value item, the corresponding template is found and
 * resolved against the parameters in each the initial template value item. The
 * resolved value is then run through the document-value permissions. If there
 * are any matching grants for the resolved initial template value, the
 * `TemplatePermissionsResult` will include `granted: true`.
 *
 * @internal
 */
export const useTemplatePermissionsFromHookFactory =
  createHookFromObservableFactory(getTemplatePermissions)

/** @internal */
export function useTemplatePermissions({
  templateItems,
  ...rest
}: PartialExcept<TemplatePermissionsOptions, 'templateItems'>): ReturnType<
  typeof useTemplatePermissionsFromHookFactory
> {
  const schema = useSchema()
  const templates = useTemplates()
  const grantsStore = useGrantsStore()
  const initialValueContext = useInitialValueResolverContext()

  return useTemplatePermissionsFromHookFactory(
    useMemo(
      () => ({
        templateItems,
        grantsStore: rest.grantsStore || grantsStore,
        schema: rest.schema || schema,
        templates: rest.templates || templates,
        context: initialValueContext,
      }),
      [
        grantsStore,
        initialValueContext,
        rest.grantsStore,
        rest.schema,
        rest.templates,
        schema,
        templateItems,
        templates,
      ],
    ),
  )
}
