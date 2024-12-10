import {RestoreIcon} from '@sanity/icons'

import {Button} from '../../../../../ui-components/button/Button'
import {type ReleaseDocument} from '../../../store/types'
import {type DocumentInRelease} from '../../detail/useBundleDocuments'

interface ReleasePublishAllButtonProps {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  disabled?: boolean
}

const fetchAndParseAll = async () => {
  if (!versionIds) return
  if (!releaseId) return
  const transactions: TransactionLogEventWithEffects[] = []
  const stream = await getJsonStream(transactionsUrl, token)
  const reader = stream.getReader()
  let result
  for (;;) {
    result = await reader.read()
    if (result.done) {
      break
    }
    if ('error' in result.value) {
      throw new Error(result.value.error.description || result.value.error.type)
    }
    transactions.push(result.value)
  }
}

const useAdjacentTransactions = (documents: DocumentInRelease[]) => {
  const transactionId = documents[0]?.document._rev
}

export const ReleaseRevertButton = ({release, documents, disabled}) => {
  const getAdjacentTransactions = useAdjacentTransactions(documents)

  return (
    <>
      <Button icon={RestoreIcon} text="Revert release" tone="critical" disabled={disabled} />
    </>
  )
}
