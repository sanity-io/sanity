import {type InitialValueResolverContext, type Schema} from '@sanity/types'
import {useMemo} from 'react'
import {combineLatest, defer, from, type Observable, of} from 'rxjs'
import {concatMap, map, switchMap, toArray} from 'rxjs/operators'

import {useSchema, useTemplates} from '../../../hooks'
import {type InitialValueTemplateItem, resolveInitialValue, type Template} from '../../../templates'
import {
  createHookFromObservableFactory,
  getDraftId,
  getPublishedId,
  type PartialExcept,
} from '../../../util'
import {useGrantsStore} from '../datastores'
import {useInitialValueResolverContext} from '../document'
import {getDocumentValuePermissions} from './documentValuePermissions'
import {type GrantsStore, type PermissionCheckResult} from './types'

/** @internal */
export interface TemplatePermissionsResult<TInitialValue = Record<string, unknown>>
  extends PermissionCheckResult,
    InitialValueTemplateItem {
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

  return item as T
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
}: TemplatePermissionsOptions): Observable<
  Array<TemplatePermissionsResult<Record<string, unknown>>>
> {
  if (!templateItems?.length) return of([])

  return defer(() => {
    // Process items sequentially
    return from(templateItems).pipe(
      // Serialize and resolve each item one at a time
      concatMap(async (item) => {
        const serializedItem = serialize(item)
        const template = templates.find((t) => t.id === serializedItem.templateId)

        if (!template) {
          throw new Error(`template not found: "${serializedItem.templateId}"`)
        }

        const resolvedInitialValue = await resolveInitialValue(
          schema,
          template,
          serializedItem.parameters,
          context,
          {useCache: true},
        )

        return {item: serializedItem, template, resolvedInitialValue}
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
      // Switch to combined observable of all permission checks
      switchMap((observables) => combineLatest(observables)),
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
