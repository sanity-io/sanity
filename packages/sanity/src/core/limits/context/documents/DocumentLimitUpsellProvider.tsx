import {type PropsWithChildren, useContext} from 'react'
import {DocumentLimitUpsellContext, type DocumentLimitUpsellContextValue} from 'sanity/_singletons'

import {useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellContextDialog} from '../../../studio/upsell/UpsellContextDialog'

export function DocumentLimitUpsellProvider({children}: PropsWithChildren) {
  // Only a document limit error shows this content (the dialog, or the panel that replaces a
  // tool), and both start the request themselves
  const contextValue = useUpsellContext({
    dataUri: '/journey/document-limit',
    feature: 'document-limits',
    preLoadData: false,
  })

  return (
    <DocumentLimitUpsellContext.Provider value={contextValue}>
      {children}
      <UpsellContextDialog contextValue={contextValue} />
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
