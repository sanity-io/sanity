import {useMemo} from 'react'
import {useTemplatePermissions, TemplatePermissionsResult} from '../../../../store'
import {InitialValueTemplateItem} from '../../../../templates/types'
import {useSource} from '../../../source'

export interface OptionItem extends Omit<InitialValueTemplateItem, 'parameters'> {
  hasPermission: boolean
}

interface NewDocumentOptionsValue {
  canCreateDocument: boolean
  loading: boolean
  options: OptionItem[]
}

export function useNewDocumentOptions(): NewDocumentOptionsValue {
  const {
    __internal: {staticInitialValueTemplateItems},
  } = useSource()

  const [permissions, loading] = useTemplatePermissions({
    templateItems: staticInitialValueTemplateItems,
  })

  const keyedPermissions = useMemo(() => {
    if (!permissions) return {}
    return permissions.reduce<Record<string, TemplatePermissionsResult>>((acc, next) => {
      acc[next.id] = next
      return acc
    }, {})
  }, [permissions])

  const canCreateDocument = staticInitialValueTemplateItems.some(
    (t) => keyedPermissions[t.id]?.granted
  )

  const optionsWithPermissions = useMemo(() => {
    return staticInitialValueTemplateItems.map((item) => {
      const permission = keyedPermissions[item.id]
      return {
        ...item,
        hasPermission: permission?.granted,
      }
    })
  }, [keyedPermissions, staticInitialValueTemplateItems])

  return {
    canCreateDocument,
    loading,
    options: optionsWithPermissions,
  }
}
