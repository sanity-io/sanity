import {
  getTemplateById,
  resolveInitialValue,
  Template as TemplateType,
} from '@sanity/initial-value-templates'
import {InitialValueTemplateItem} from '@sanity/structure'
import {Observable, combineLatest, from, of} from 'rxjs'
import {switchMap, map} from 'rxjs/operators'
import {Schema} from '@sanity/types'
import {createHookFromObservableFactory} from '../../util/createHookFromObservableFactory'
import {getDraftId, getPublishedId} from '../../util/draftUtils'
import {GrantsStore, PermissionCheckResult} from './types'
import {unstable_getDocumentValuePermissions as getDocumentValuePermissions} from './documentValuePermissions'

type Template = ReturnType<typeof getTemplateById>

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

/**
 * The observable version of `useTemplatePermissions`
 */
function getTemplatePermissions(
  grantsStore: GrantsStore,
  schema: Schema,
  initialValueTemplates: TemplateType[],
  initialValueTemplateItems: Array<
    InitialValueTemplateItem | Serializable<InitialValueTemplateItem>
  >
): Observable<Array<TemplatePermissionsResult<Record<string, unknown>>>> {
  if (!initialValueTemplateItems?.length) return of([])

  return combineLatest(
    initialValueTemplateItems
      .map(serialize)
      .map(async (item) => {
        const template = getTemplateById(schema, initialValueTemplates, item.templateId)

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
const useTemplatePermissions = createHookFromObservableFactory(getTemplatePermissions)

export {
  /* eslint-disable camelcase */
  getTemplatePermissions as unstable_getTemplatePermissions,
  useTemplatePermissions as unstable_useTemplatePermissions,
  /* eslint-enable camelcase */
}
