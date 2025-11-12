import {useContext} from 'react'
import {
  SingleDocReleaseUpsellContext,
  type SingleDocReleaseUpsellContextValue,
} from 'sanity/_singletons'

import {getDialogPropsFromContext, useUpsellContext} from '../../hooks/useUpsellContext'
import {UpsellDialog} from '../../studio/upsell/UpsellDialog'

/**
 * @beta
 */
export function SingleDocReleaseUpsellProvider(props: {children: React.ReactNode}) {
  const contextValue = useUpsellContext({
    dataUri: '/journey/scheduled-drafts',
    feature: 'single_doc_release',
  })

  return (
    <SingleDocReleaseUpsellContext.Provider value={contextValue}>
      {props.children}
      <UpsellDialog {...getDialogPropsFromContext(contextValue)} />
    </SingleDocReleaseUpsellContext.Provider>
  )
}

export function useSingleDocReleaseUpsell(): SingleDocReleaseUpsellContextValue {
  const context = useContext(SingleDocReleaseUpsellContext)
  return context
}
