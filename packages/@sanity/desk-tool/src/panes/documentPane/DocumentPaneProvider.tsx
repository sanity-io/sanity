/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from 'react'
import {useDocumentPresence} from '@sanity/base/hooks'
import schema from 'part:@sanity/base/schema'
import {
  useConnectionState,
  useDocumentOperation,
  useEditState,
  useValidationStatus
} from '@sanity/react-hooks'
import {LoadingPane} from '../loadingPane'
import withInitialValue from '../../utils/withInitialValue'
import ErrorPane from '../errorPane/ErrorPane'
import {Doc, MenuAction} from './types'
import DocumentPane from './DocumentPane'

declare const __DEV__: boolean

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
  menuItems: MenuAction[]
  menuItemGroups: {id: string}[]
  views: {
    type: string
    id: string
    title: string
    options: {}
    component: React.ComponentType<any>
  }[]
  initialValue?: Doc
  options: {
    id: string
    type: string
    template?: string
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

  const typeName = props.options.type

  const schemaType = schema.get(typeName)

  if (!schemaType) {
    const value = editState && (editState.draft || editState.published)

    return (
      <ErrorPane
        {...props}
        color="warning"
        title={
          <>
            Unknown document type: <code>{typeName}</code>
          </>
        }
      >
        {typeName && (
          <p>
            This document has the schema type <code>{typeName}</code>, which is not defined as a
            type in the local content studio schema.
          </p>
        )}
        {!typeName && <p>This document does not exist, and no schema type was specified for it.</p>}
        {__DEV__ && value && (
          <div>
            <h4>Here is the JSON representation of the document:</h4>
            <pre>
              <code>{JSON.stringify(value, null, 2)}</code>
            </pre>
          </div>
        )}
      </ErrorPane>
    )
  }

  if (connectionState === 'connecting' || !editState) {
    return <LoadingPane {...props} delay={600} message={`Loading ${schemaType.title}…`} />
  }

  return (
    <DocumentPane
      {...props}
      schemaType={schemaType}
      onChange={onChange}
      markers={markers}
      connectionState={connectionState}
      presence={presence}
      draft={editState.draft}
      published={editState.published}
    />
  )
})

export default DocumentPaneProvider
