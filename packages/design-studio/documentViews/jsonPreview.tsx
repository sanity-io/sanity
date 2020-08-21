import {useEditState} from '@sanity/react-hooks'
import React from 'react'

export function JSONPreviewDocumentView(props: any) {
  const editState: any = useEditState(props.documentId, props.schemaType.name)

  return <pre>{JSON.stringify(editState.draft || editState.published, null, 2)}</pre>
}
