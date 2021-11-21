import {getTemplateById, resolveInitialValue} from '@sanity/initial-value-templates'
import {InitialValueTemplateItem} from '@sanity/structure'
import {Observable, combineLatest, from, of} from 'rxjs'
import {switchMap, map} from 'rxjs/operators'
import {Schema} from '@sanity/types'
import {createHookFromObservableFactory} from '../../util/createHookFromObservableFactory'
import {PermissionCheckResult} from './types'
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

function getTemplatePermissions(
  initialValueTemplateItems: Array<
    InitialValueTemplateItem | Serializable<InitialValueTemplateItem>
  >
): Observable<Record<string, TemplatePermissionsResult<Record<string, unknown>>>> {
  // this has to be deferred/lazy-loaded due to some weird dependency orderings
  const schemaMod = require('part:@sanity/base/schema')
  const schema: Schema = schemaMod.default || schemaMod

  if (!initialValueTemplateItems?.length) return of({})

  return combineLatest(
    initialValueTemplateItems
      .map(serialize)
      .map(async (item) => {
        const template = getTemplateById(item.templateId)
        const resolvedInitialValue = await resolveInitialValue(schema, template, item.parameters)

        return {template, item, resolvedInitialValue}
      })
      .map((promise) =>
        from(promise).pipe(
          switchMap(({item, resolvedInitialValue, template}) => {
            const schemaType = schema.get(template.schemaType)
            const liveEdit = schemaType?.liveEdit

            return getDocumentValuePermissions({
              permission: 'create',
              document: {
                _id: liveEdit ? 'dummy-id' : 'drafts.dummy-id',
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
  ).pipe(
    map((results) =>
      results.reduce<Record<string, TemplatePermissionsResult>>((acc, next) => {
        acc[next.id] = next
        return acc
      }, {})
    )
  )
}

const useTemplatePermissions = createHookFromObservableFactory(getTemplatePermissions, {
  initialValue: {},
})

export {
  /* eslint-disable camelcase */
  getTemplatePermissions as unstable_getTemplatePermissions,
  useTemplatePermissions as unstable_useTemplatePermissions,
  /* eslint-enable camelcase */
}
