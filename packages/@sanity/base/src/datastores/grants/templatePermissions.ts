import {Observable, combineLatest, from, of} from 'rxjs'
import {switchMap, map} from 'rxjs/operators'
import {Schema} from '@sanity/types'
import {useSchema, useTemplates} from '../../hooks'
import {resolveInitialValue, Template, InitialValueTemplateItem} from '../../templates'
import {createHookFromObservableFactory} from '../../util/createHookFromObservableFactory'
import {getDraftId, getPublishedId} from '../../util/draftUtils'
import {useGrantsStore} from '../datastores'
import {PartialExcept} from '../../util/PartialExcept'
import {GrantsStore, PermissionCheckResult} from './types'
import {getDocumentValuePermissions} from './documentValuePermissions'

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
  if (item && 'serialize' in item) return serialize(item.serialize())
  return item as T
}

export interface TemplatePermissionsOptions {
  grantsStore: GrantsStore
  schema: Schema
  templates: Template[]
  templateItems: InitialValueTemplateItem[]
}

/**
 * The observable version of `useTemplatePermissions`
 */
export function getTemplatePermissions({
  grantsStore,
  templateItems,
  templates,
  schema,
}: TemplatePermissionsOptions): Observable<
  Array<TemplatePermissionsResult<Record<string, unknown>>>
> {
  if (!templateItems?.length) return of([])

  return combineLatest(
    templateItems
      .map(serialize)
      .map(async (item) => {
        const template = templates.find((t) => t.id === item.templateId)

        if (!template) {
          throw new Error(`template not found: "${item.templateId}"`)
        }

        const resolvedInitialValue = await resolveInitialValue(schema, template, item.parameters)

        return {template, item, resolvedInitialValue}
      })
      .map((promise) =>
        from(promise).pipe(
          switchMap(({item, resolvedInitialValue, template}) => {
            const schemaType = schema.get(template.schemaType)

            if (!schemaType) {
              throw new Error(`schema type not found: "${template.schemaType}"`)
            }

            const liveEdit = schemaType?.liveEdit
            const {initialDocumentId = 'dummy-id'} = item

            return getDocumentValuePermissions({
              grantsStore,
              permission: 'create',
              document: {
                _id: liveEdit ? getPublishedId(initialDocumentId) : getDraftId(initialDocumentId),
                ...resolvedInitialValue,
              },
            }).pipe(
              map(({granted, reason}) => {
                const title = item.title || template.title
                const result: TemplatePermissionsResult = {
                  ...item,
                  granted,
                  reason,
                  resolvedInitialValue,
                  template,
                  title,
                  subtitle: schemaType.title === title ? undefined : schemaType.title,
                  description: item.description || template.description,
                  icon: item.icon || template.icon,
                }

                return result
              })
            )
          })
        )
      )
  )
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
 */
export const useTemplatePermissionsFromHookFactory =
  createHookFromObservableFactory(getTemplatePermissions)

export function useTemplatePermissions({
  templateItems,
  ...rest
}: PartialExcept<TemplatePermissionsOptions, 'templateItems'>): ReturnType<
  typeof useTemplatePermissionsFromHookFactory
> {
  const schema = useSchema()
  const templates = useTemplates()
  const grantsStore = useGrantsStore()

  return useTemplatePermissionsFromHookFactory({
    templateItems,
    grantsStore: rest.grantsStore || grantsStore,
    schema: rest.schema || schema,
    templates: rest.templates || templates,
  })
}
