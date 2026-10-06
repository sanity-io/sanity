import {memo, type ReactNode, useMemo} from 'react'
import {CommentsEnabledContext} from 'sanity/_singletons'

import {useSource} from '../../../studio/source'
import {getPublishedId} from '../../../util/draftUtils'

interface CommentsEnabledProviderProps {
  children: ReactNode
  documentId: string
  documentType: string
}

/**
 * Resolves whether comments are enabled for the document from the workspace's
 * `document.comments.enabled` config. Synchronous: the plan check only decides the mode, which
 * `useCommentsEnabled()` reads from the plugin's `CommentsModePromiseContext`.
 *
 * @beta
 * @hidden
 */
export const CommentsEnabledProvider = memo(function CommentsEnabledProvider(
  props: CommentsEnabledProviderProps,
) {
  const {children, documentId, documentType} = props
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {enabled} = useSource().document.comments
  const enabledFromConfig = useMemo(
    () => enabled({documentType, documentId: getPublishedId(documentId)}),
    [documentId, documentType, enabled],
  )

  return <CommentsEnabledContext value={enabledFromConfig}>{children}</CommentsEnabledContext>
})
