import {useContext} from 'react'
import {
  SingleDocReleaseUpsellContext,
  type SingleDocReleaseUpsellContextValue,
} from 'sanity/_singletons'

import {useUpsellDialog} from '../../hooks/useUpsellDialog'

/**
 * @beta
 */
export function SingleDocReleaseUpsellProvider(props: {children: React.ReactNode}) {
  const {DialogComponent, contextValue} = useUpsellDialog({
    dataUri: '/journey/scheduled-drafts',
    feature: 'single_doc_release',
  })

  return (
    <SingleDocReleaseUpsellContext.Provider value={contextValue}>
      {props.children}
      <DialogComponent />
    </SingleDocReleaseUpsellContext.Provider>
  )
}

export function useSingleDocReleaseUpsell(): SingleDocReleaseUpsellContextValue {
  const context = useContext(SingleDocReleaseUpsellContext)
  return context
}
