import * as React from 'react'
import DocumentPane from './DocumentPane'
import withInitialValue from '../../utils/withInitialValue'
import {useDocumentPresence} from '@sanity/base/hooks'

import {
  useConnectionState,
  useDocumentOperation,
  useEditState,
  useValidationStatus
} from '@sanity/react-hooks'

interface Props {
  title?: string
  paneKey: string
  type: any
  isLoading: boolean
  isSelected: boolean
  isCollapsed: boolean
  onChange: (patches: any[]) => void
  isClosable: boolean
  onExpand?: () => void
  onCollapse?: () => void
  menuItems: {title: string}[]
  menuItemGroups: {id: string}[]
  views: {
    type: string
    id: string
    title: string
    options: {}
    component: React.ComponentType<any>
  }[]
  initialValue?: {[field: string]: any}
  options: {
    id: string
    type: string
    template?: string
  }
  urlParams: {
    view: string
    rev: string
  }
}

const DocumentPaneProvider = withInitialValue((props: Props) => {
  const {patch}: any = useDocumentOperation(props.options.id, props.options.type)
  const editState: any = useEditState(props.options.id, props.options.type)
  const {markers} = useValidationStatus(props.options.id, props.options.type)
  const presence = useDocumentPresence(props.options.id)

  const connectionState = useConnectionState(props.options.id, props.options.type)

  const onChange = React.useCallback(
    patches => {
      patch.execute(patches, props.initialValue)
    },
    [patch]
  )

  const value = (editState && (editState.draft || editState.published)) || props.initialValue
  return (
    <DocumentPane
      {...props}
      onChange={onChange}
      markers={markers}
      connectionState={connectionState}
      value={value}
      presence={presence}
      draft={editState && editState.draft}
      published={editState && editState.published}
    />
  )
})

export default DocumentPaneProvider
