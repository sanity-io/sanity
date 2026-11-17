import {Suspense, use} from 'react'
import {CommentsUpsellContextV2} from 'sanity/_singletons'

import {type UpsellContextValue, useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellContextDialog} from '../../../studio/upsell/UpsellContextDialog'
import {useCommentsMode} from '../../hooks/useCommentsMode'

/**
 * Mounted in both plan modes by `CommentsStudioLayout`, so the layout never waits for the
 * comments feature check. The UI that opens the dialog already knows it is in upsell mode (it
 * awaited `useCommentsMode()`); the dialog leaf below checks once more, at the leaf, so a plan
 * that has comments never shows it.
 *
 * @beta
 * @hidden
 */
export function CommentsUpsellProvider(props: {children: React.ReactNode}) {
  const contextValue = useUpsellContext({
    dataUri: '/journey/comments',
    feature: 'comments',
  })

  return (
    <CommentsUpsellContextV2.Provider value={contextValue}>
      {props.children}
      <Suspense>
        <CommentsUpsellDialog contextValue={contextValue} />
      </Suspense>
    </CommentsUpsellContextV2.Provider>
  )
}

function CommentsUpsellDialog({contextValue}: {contextValue: UpsellContextValue}) {
  // Only the upsell mode has a dialog to show; a plan with comments, or a failed check that
  // disabled them, never does
  if (use(useCommentsMode()) !== 'upsell') return null
  return <UpsellContextDialog contextValue={contextValue} />
}
