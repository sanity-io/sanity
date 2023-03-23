import {useMemo} from 'react'
import {useTemplatePermissions} from '../../../../store'
import {useSource} from '../../../source'
import {NewDocumentOption} from './types'

interface NewDocumentOptionsValue {
  canCreateDocument: boolean
  loading: boolean
  options: NewDocumentOption[]
}

/**
 * @internal
 */
export function useNewDocumentOptions(): NewDocumentOptionsValue {
  const {
    __internal: {staticInitialValueTemplateItems},
  } = useSource()

  const [permissions, loading] = useTemplatePermissions({
    templateItems: staticInitialValueTemplateItems,
  })

  const canCreateDocument =
    permissions?.some((p) => staticInitialValueTemplateItems.some((t) => t.id === p.id)) || false

  const optionsWithPermissions = useMemo(() => {
    return staticInitialValueTemplateItems.map((item) => {
      return {
        ...item,
        title: item?.title || item.id,
        hasPermission: permissions?.find((p) => p.id === item.id)?.granted || false,
      }
    })
  }, [permissions, staticInitialValueTemplateItems])

  return {
    canCreateDocument,
    loading,
    options: optionsWithPermissions,
  }
}
