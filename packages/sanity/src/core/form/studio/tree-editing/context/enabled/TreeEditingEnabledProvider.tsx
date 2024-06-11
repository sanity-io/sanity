import {useMemo} from 'react'
import {type ArraySchemaType, useSource} from 'sanity'

import {usePortableTextAware} from '../../../../hooks/usePortableTextAware'
import {TreeEditingEnabledContext} from './TreeEditingEnabledContext'
import {type TreeEditingEnabledContextValue} from './types'
import {useTreeEditingEnabled} from './useTreeEditingEnabled'

interface TreeEditingEnabledProviderProps {
  children: React.ReactNode
  parentSchemaType?: ArraySchemaType<unknown>
}

export function TreeEditingEnabledProvider(props: TreeEditingEnabledProviderProps): JSX.Element {
  const {children, parentSchemaType} = props

  const {features} = useSource()
  const parentContextValue = useTreeEditingEnabled()
  const hasEditorParent = usePortableTextAware()?.hasEditorParent

  const value = useMemo((): TreeEditingEnabledContextValue => {
    const legacyEditing =
      // If we are inside a portable text editor, we should enable legacy editing
      hasEditorParent ||
      // If any parent schema type has tree editing disabled, we should enable
      // legacy array editing for any child array items by passing down the
      // parent context value
      parentContextValue.legacyEditing ||
      // If the tree editing is disabled in the current schema type, we should enable
      //legacy array editing
      parentSchemaType?.options?.treeEditing === false

    return {
      enabled: features?.beta?.treeArrayEditing?.enabled === true,
      legacyEditing: Boolean(legacyEditing),
    }
  }, [
    features?.beta?.treeArrayEditing?.enabled,
    hasEditorParent,
    parentContextValue.legacyEditing,
    parentSchemaType?.options?.treeEditing,
  ])

  return (
    <TreeEditingEnabledContext.Provider value={value}>
      {children}
    </TreeEditingEnabledContext.Provider>
  )
}
