import {getTemplateById, resolveInitialValue} from '@sanity/initial-value-templates'
import {InitialValueTemplateItem} from '@sanity/structure'
import {combineLatest, from, Observable} from 'rxjs'
import {switchMap, map} from 'rxjs/operators'
import {Schema} from '@sanity/types'
import {createHookFromObservableFactory} from '../../util/createHookFromObservableFactory'
import {PermissionCheckResult} from './types'
import grantsStore from './createGrantsStore'

const {checkDocumentPermission} = grantsStore

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

function getTemplatePermissions(
  initialValueTemplateItems: InitialValueTemplateItem[]
): Observable<Record<string, TemplatePermissionsResult<Record<string, unknown>>>> {
  // this has to be deferred/lazy-loaded due to some weird dependency orderings
  const schemaMod = require('part:@sanity/base/schema')
  const schema: Schema = schemaMod.default || schemaMod

  return combineLatest(
    initialValueTemplateItems
      .map(async (item) => {
        const template = getTemplateById(item.templateId)
        const resolvedInitialValue = await resolveInitialValue(schema, template, item.parameters)

        return {
          template,
          item,
          resolvedInitialValue,
        }
      })
      .map((promise) =>
        from(promise).pipe(
          switchMap(({item, resolvedInitialValue, template}) => {
            const schemaType = schema.get(template.schemaType)
            const liveEdit = schemaType?.liveEdit

            return checkDocumentPermission('create', {
              _id: liveEdit ? 'dummy-id' : 'drafts.dummy-id',
              ...resolvedInitialValue,
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
