import * as React from 'react'
import {useDocumentPresence} from '@sanity/base/hooks'
import {
  useConnectionState,
  useDocumentOperation,
  useEditState,
  useValidationStatus
} from '@sanity/react-hooks'
import schema from 'part:@sanity/base/schema'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import withInitialValue from '../../utils/withInitialValue'
import ErrorPane from '../errorPane/ErrorPane'
import {LoadingPane} from '../loadingPane'
import {DocumentHistoryProvider} from './documentHistory'
import {DocumentPane} from './documentPane'
import {Doc, DocumentPaneOptions, MenuAction} from './types'
import {getInitialValue} from './utils/value'

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
  options: DocumentPaneOptions
}

// eslint-disable-next-line complexity
export const DocumentPaneProvider = withInitialValue((props: Props) => {
  const documentIdRaw = props.options.id
  const documentId = getPublishedId(documentIdRaw)
  const documentTypeName = props.options.type
  const {patch}: any = useDocumentOperation(documentIdRaw, documentTypeName)
  const editState: any = useEditState(documentIdRaw, documentTypeName)
  const {markers} = useValidationStatus(documentIdRaw, documentTypeName)
  const presence = useDocumentPresence(documentIdRaw)
  const connectionState = useConnectionState(documentIdRaw, documentTypeName)
  const schemaType = schema.get(documentTypeName)

  const onChange = React.useCallback(
    patches => {
      patch.execute(patches, props.initialValue)
    },
    [patch]
  )

  if (!schemaType) {
    const value = editState && (editState.draft || editState.published)

    return (
      <ErrorPane
        {...props}
        color="warning"
        title={
          <>
            Unknown document type: <code>{documentTypeName}</code>
          </>
        }
      >
        {documentTypeName && (
          <p>
            This document has the schema type <code>{documentTypeName}</code>, which is not defined
            as a type in the local content studio schema.
          </p>
        )}
        {!documentTypeName && (
          <p>This document does not exist, and no schema type was specified for it.</p>
        )}
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

  const initialValue = getInitialValue({initialValue: props.initialValue, options: props.options})
  const value = editState.draft || editState.published || initialValue

  return (
    <DocumentHistoryProvider
      documentId={documentId}
      draft={editState.draft}
      published={editState.published}
      value={value}
    >
      <DocumentPane
        {...props}
        connectionState={connectionState}
        documentId={documentId}
        documentIdRaw={documentIdRaw}
        documentType={documentTypeName}
        initialValue={initialValue}
        markers={markers}
        onChange={onChange}
        presence={presence}
        schemaType={schemaType}
        value={value}
      />
    </DocumentHistoryProvider>
  )
})
