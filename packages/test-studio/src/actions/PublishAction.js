import {omit} from 'lodash'
import {useDocumentOperations} from '../test-action-tool/useDocumentOperations'

export default function PublishAction(docInfo) {
  if (docInfo.isLiveEditEnabled) {
    return null
  }

  const {publish} = useDocumentOperations(docInfo.id, docInfo.type)

  return {
    disabled: !docInfo.draft,
    label: 'Publish',
    handle: () => {
      publish(doc => omit(doc, 'reviewers'))
    }
  }
}
