import {Suspense, useContext} from 'react'
import {
  SingleDocReleaseUpsellContext,
  type SingleDocReleaseUpsellContextValue,
} from 'sanity/_singletons'

import {useUpsellContext} from '../../hooks/useUpsellContext'
import {UpsellContextDialog} from '../../studio/upsell/UpsellContextDialog'

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
      <Suspense>
        <UpsellContextDialog contextValue={contextValue} />
      </Suspense>
    </SingleDocReleaseUpsellContext.Provider>
  )
}

export function useSingleDocReleaseUpsell(): SingleDocReleaseUpsellContextValue {
  const context = useContext(SingleDocReleaseUpsellContext)
  return context
}
