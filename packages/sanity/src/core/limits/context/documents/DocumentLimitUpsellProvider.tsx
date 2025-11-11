import {type PropsWithChildren, useContext} from 'react'
import {DocumentLimitUpsellContext, type DocumentLimitUpsellContextValue} from 'sanity/_singletons'

import {useUpsellDialog} from '../../../hooks/useUpsellDialog'

export function DocumentLimitUpsellProvider({children}: PropsWithChildren) {
  const {DialogComponent, contextValue} = useUpsellDialog({
    dataUri: '/journey/document-limit',
    feature: 'document-limits',
  })

  return (
    <DocumentLimitUpsellContext.Provider value={contextValue}>
      {children}
      <DialogComponent />
    </DocumentLimitUpsellContext.Provider>
  )
}

/**
 * @internal
 */
export const useDocumentLimitsUpsellContext = (): DocumentLimitUpsellContextValue => {
  const context = useContext(DocumentLimitUpsellContext)
  if (!context) {
    throw new Error(
      'useDocumentLimitsUpsellContext must be used within a DocumentLimitUpsellProvider',
    )
  }
  return context
}
