import {type ReactNode, useContext} from 'react'
import {DocumentActionPropsContext} from 'sanity/_singletons'

import {type DocumentActionProps} from '../../config/document/actions'

function DocumentActionPropsProvider({
  children,
  value,
}: {
  children: ReactNode
  value: DocumentActionProps
}) {
  return (
    <DocumentActionPropsContext.Provider value={value}>
      {children}
    </DocumentActionPropsContext.Provider>
  )
}

function useDocumentActionProps() {
  const context = useContext(DocumentActionPropsContext)
  if (context === undefined) {
    throw new Error('useDocumentActionProps must be used within a DocumentActionPropsProvider')
  }
  return context
}

export {DocumentActionPropsProvider, useDocumentActionProps}
