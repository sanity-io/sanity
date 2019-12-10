import {omit} from 'lodash'
import {useDocumentOperation} from '@sanity/react-hooks'

export default function PublishAction(docInfo) {
  if (docInfo.isLiveEditEnabled) {
    return null
  }

  const {publish} = useDocumentOperation(docInfo.id, docInfo.type)

  return {
    disabled: !docInfo.draft,
    label: 'Publish',
    handle: () => {
      publish(doc => omit(doc, 'reviewers'))
    }
  }
}
