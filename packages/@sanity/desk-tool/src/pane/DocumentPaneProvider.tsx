import * as React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {useEditState} from '@sanity/react-hooks'
import DocumentPane from './DocumentPane'
import withInitialValue from '../utils/withInitialValue'

interface Props {
  options: {
    id: string
    type: string
  }
  initialValue: {}
}

export const DocumentPaneProvider = withInitialValue((props: Props) => {
  const {patch} = useDocumentOperation(props.options.id, props.options.type)
  const editState: any = useEditState(props.options.id, props.options.type)

  const value = (editState && (editState.draft || editState.published)) || props.initialValue
  return (
    <DocumentPane
      {...props}
      isLoading={!value}
      onChange={patch}
      value={value}
      draft={editState && editState.draft}
      published={editState && editState.published}
      markers={editState ? editState.validation : []}
      isLoading={!editState}
    />
  )
})
