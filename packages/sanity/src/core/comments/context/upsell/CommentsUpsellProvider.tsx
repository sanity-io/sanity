import {CommentsUpsellContext} from 'sanity/_singletons'

import {useUpsellDialog} from '../../../hooks/useUpsellDialog'

/**
 * @beta
 * @hidden
 */
export function CommentsUpsellProvider(props: {children: React.ReactNode}) {
  const {DialogComponent, contextValue} = useUpsellDialog({
    dataUri: '/journey/comments',
    feature: 'comments',
  })

  return (
    <CommentsUpsellContext.Provider value={contextValue}>
      {props.children}
      <DialogComponent />
    </CommentsUpsellContext.Provider>
  )
}
