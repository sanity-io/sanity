import {CommentsUpsellLegacyContext} from 'sanity/_singletons'

import {getDialogPropsFromContext, useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'

/**
 * @beta
 * @hidden
 */
export function CommentsUpsellProvider(props: {children: React.ReactNode}) {
  const contextValue = useUpsellContext({
    dataUri: '/journey/comments',
    feature: 'comments',
  })

  return (
    <CommentsUpsellLegacyContext.Provider value={contextValue}>
      {props.children}
      <UpsellDialog {...getDialogPropsFromContext(contextValue)} />
    </CommentsUpsellLegacyContext.Provider>
  )
}
