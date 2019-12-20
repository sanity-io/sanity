import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'
import {useRouter} from 'part:@sanity/base/router'

export const HistoryRestoreAction = createAction(function RestoreRevisionAction({
  id,
  type,
  historyId,
  revision,
  onComplete
}) {
  const {restoreFrom}: any = useDocumentOperation(id, type)
  const router = useRouter()

  return {
    label: 'Restore',
    onHandle: () => {
      restoreFrom.execute(historyId, revision).then(result => {
        router.navigateIntent('edit', {id, type, rev: result.transactionId})
        onComplete()
      })
    }
  }
})
