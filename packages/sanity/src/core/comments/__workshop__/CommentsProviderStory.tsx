/* eslint-disable react/jsx-handler-names */
import {useSelect, useString} from '@sanity/ui-workshop'
import {useMemo} from 'react'

import {ConditionalWrapper} from '../../../ui-components/conditionalWrapper/ConditionalWrapper'
import {useCurrentUser} from '../../store/user/hooks'
import {AddonDatasetProvider} from '../../studio/addonDataset/AddonDatasetProvider'
import {CommentsList} from '../components/list/CommentsList'
import {CommentsUpsellPanel} from '../components/upsell/CommentsUpsellPanel'
import {CommentsEnabledProvider} from '../context/enabled/CommentsEnabledProvider'
import {CommentsProvider} from '../context/comments/CommentsProvider'
import {CommentsUpsellProvider} from '../context/upsell/CommentsUpsellProvider'
import {useComments} from '../hooks/useComments'
import {useCommentsUpsell} from '../hooks/useCommentsUpsell'
import {type CommentsUIMode} from '../types'

const noop = () => {
  // ...
}
const MODES = {
  default: 'default',
  upsell: 'upsell',
} as const

export default function CommentsProviderStory() {
  const _type = useString('_type', 'author') || 'author'
  const _id = useString('_id', 'grrm') || 'grrm'
  const _mode = useSelect('_mode', MODES) || ('default' as keyof typeof MODES)

  return (
    <AddonDatasetProvider>
      <CommentsEnabledProvider documentType={_type} documentId={_id}>
        <CommentsProvider documentType={_type} documentId={_id} type="field" sortOrder="desc">
          <ConditionalWrapper
            condition={_mode === 'upsell'}
            // eslint-disable-next-line react/jsx-no-bind
            wrapper={(children) => <CommentsUpsellProvider>{children}</CommentsUpsellProvider>}
          >
            <Inner mode={_mode} />
          </ConditionalWrapper>
        </CommentsProvider>
      </CommentsEnabledProvider>
    </AddonDatasetProvider>
  )
}

function Inner({mode}: {mode: CommentsUIMode}) {
  const {comments, mentionOptions, operation} = useComments()
  const currentUser = useCurrentUser()
  const {upsellData, telemetryLogs} = useCommentsUpsell()

  const beforeListNode = useMemo(() => {
    if (mode === 'upsell' && upsellData) {
      return (
        <CommentsUpsellPanel
          data={upsellData}
          onPrimaryClick={telemetryLogs.panelPrimaryClicked}
          onSecondaryClick={telemetryLogs.panelSecondaryClicked}
        />
      )
    }

    return null
  }, [mode, telemetryLogs.panelPrimaryClicked, telemetryLogs.panelSecondaryClicked, upsellData])

  if (!currentUser) return null

  return (
    <CommentsList
      beforeListNode={beforeListNode}
      comments={comments.data.open}
      currentUser={currentUser}
      error={comments.error}
      loading={comments.loading}
      mentionOptions={mentionOptions}
      mode={mode}
      onCreateRetry={noop}
      onDelete={operation.remove}
      onEdit={operation.update}
      // eslint-disable-next-line react/jsx-no-bind
      onNewThreadCreate={(c) =>
        operation.create({type: 'field', fieldPath: c.payload?.fieldPath || '', ...c})
      }
      onReactionSelect={operation.react}
      // eslint-disable-next-line react/jsx-no-bind
      onReply={(c) =>
        operation.create({type: 'field', fieldPath: c.payload?.fieldPath || '', ...c})
      }
      selectedPath={null}
      status="open"
    />
  )
}
