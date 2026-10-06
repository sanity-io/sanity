import {type PropsWithChildren, Suspense, useContext} from 'react'
import {DocumentLimitUpsellContext, type DocumentLimitUpsellContextValue} from 'sanity/_singletons'

import {useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellContextDialog} from '../../../studio/upsell/UpsellContextDialog'

export function DocumentLimitUpsellProvider({children}: PropsWithChildren) {
  const contextValue = useUpsellContext({
    dataUri: '/journey/document-limit',
    feature: 'document-limits',
  })

  return (
    <DocumentLimitUpsellContext.Provider value={contextValue}>
      {children}
      <Suspense>
        <UpsellContextDialog contextValue={contextValue} />
      </Suspense>
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
