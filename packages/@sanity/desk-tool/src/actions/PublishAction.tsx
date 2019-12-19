import * as React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'

export const PublishAction = createAction(function PublishAction(props) {
  const {publish}: any = useDocumentOperation(props.id, props.type)
  const [publishing, setPublishing] = React.useState(false)

  return {
    disabled: publishing || publish.disabled,
    label: publishing ? 'Publishing…' : 'Publish',
    title: publish.disabled ? publish.disabled : '',
    onHandle: async () => {
      setPublishing(true)
      await publish.execute()
      props.onComplete()
    }
  }
})
