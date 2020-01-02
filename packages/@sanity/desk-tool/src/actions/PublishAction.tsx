import * as React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'

export const PublishAction = createAction(function PublishAction(props) {
  const {publish}: any = useDocumentOperation(props.id, props.type)
  const [publishing, setPublishing] = React.useState(false)

  return {
    disabled: Boolean(publishing || publish.disabled),
    label: publishing ? 'Publishing…' : 'Publish',
    status: publishing ? 'Publishing' : null,
    title: publish.disabled ? publish.disabled : '',
    shortcut: 'ctrl+alt+p',
    onHandle: async () => {
      setPublishing(true)
      await publish.execute()
      props.onComplete()
    }
  }
})
