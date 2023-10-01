import React, {useMemo} from 'react'
import {useShallowMemoizedObject} from '../../util'
import {useSource} from '../../studio'
import {useDocumentId} from '../useDocumentId'
import {useDocumentType} from '../useDocumentType'
import {useTemplatePermissions} from '../../store'
import {
  ReferenceInputOptionsContext,
  ReferenceInputOptionsContextValue,
} from './ReferenceInoutOptionsContext'

/** @internal */
export interface ReferenceInputOptionsProviderProps
  extends Omit<ReferenceInputOptionsContextValue, 'initialValueTemplateItems'> {
  children: React.ReactNode
  fallback: React.ReactNode
}

/**
 * @internal
 */
export function ReferenceInputOptionsProvider({
  children,
  fallback,
  activePath,
  EditReferenceLinkComponent,
  onEditReference,
}: ReferenceInputOptionsProviderProps) {
  const documentId = useDocumentId()
  const documentType = useDocumentType()
  const {resolveNewDocumentOptions} = useSource().document

  // The templates that should be creatable from inside this document pane.
  // For example, from the "Create new" menu in reference inputs.
  const templateItems = useMemo(() => {
    return resolveNewDocumentOptions({
      type: 'document',
      documentId,
      schemaType: documentType,
    })
  }, [documentId, documentType, resolveNewDocumentOptions])

  const [templatePermissions, isTemplatePermissionsLoading] = useTemplatePermissions({
    templateItems,
  })

  const context = useShallowMemoizedObject({
    activePath,
    EditReferenceLinkComponent,
    onEditReference,
    initialValueTemplateItems: templatePermissions,
  })

  if (isTemplatePermissionsLoading) return <>{fallback}</>

  return (
    <ReferenceInputOptionsContext.Provider value={context}>
      {children}
    </ReferenceInputOptionsContext.Provider>
  )
}
