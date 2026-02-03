import {type PropsWithChildren, useContext} from 'react'
import {DocumentLimitUpsellContext, type DocumentLimitUpsellContextValue} from 'sanity/_singletons'

import {getDialogPropsFromContext, useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'

export function DocumentLimitUpsellProvider({children}: PropsWithChildren) {
  const contextValue = useUpsellContext({
    dataUri: '/journey/document-limit',
    feature: 'document-limits',
  })

  return (
    <DocumentLimitUpsellContext.Provider value={contextValue}>
      {children}
      <UpsellDialog {...getDialogPropsFromContext(contextValue)} />
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
