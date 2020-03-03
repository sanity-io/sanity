import * as React from 'react'
import DocumentPane from './DocumentPane'
import {getPublishedId, isDraftId} from 'part:@sanity/base/util/draft-utils'
import withInitialValue from '../utils/withInitialValue'
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

export const DocumentPaneProvider = withInitialValue((props: Props) => {
  const id = getPublishedId(props.options.id)
  const {patch}: any = useDocumentOperation(id, props.options.type)
  const editState: any = useEditState(id, props.options.type)
  const {markers} = useValidationStatus(id, props.options.type)
  const connectionState = useConnectionState(id, props.options.type)

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
      draft={editState && editState.draft}
      published={editState && editState.published}
    />
  )
})
