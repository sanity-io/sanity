import {isEqual} from 'lodash'
import {type ReactNode, useCallback, useContext, useMemo, useState} from 'react'
import {getPublishedId} from 'sanity'
import {CopyPasteContext} from 'sanity/_singletons'

import {type DocumentMeta} from './types'

/**
 * @beta
 * @hidden
 */
export const CopyPasteProvider: React.FC<{
  children: ReactNode
}> = ({children}) => {
  const [documentMeta, setDocumentMetaState] = useState<DocumentMeta | null>(null)

  const setDocumentMeta = useCallback(
    ({documentId, documentType, schemaType, onChange}: Required<DocumentMeta>) => {
      const processedMeta = {
        documentId: getPublishedId(documentId),
        documentType,
        schemaType,
        onChange,
      }

      setDocumentMetaState((prevMeta) => {
        if (isEqual(prevMeta, processedMeta)) {
          return prevMeta // No update if the new meta is the same as the current
        }
        return processedMeta
      })
    },
    [],
  )
  const contextValue = useMemo(
    () => ({
      documentMeta,
      onChange: documentMeta?.onChange,
      getDocumentMeta: documentMeta,
      setDocumentMeta,
    }),
    [documentMeta, setDocumentMeta],
  )

  return <CopyPasteContext.Provider value={contextValue}>{children}</CopyPasteContext.Provider>
}

/**
 * @beta
 * @hidden
 */
export const useCopyPaste = () => {
  const context = useContext(CopyPasteContext)
  if (!context) {
    throw new Error('useCopyPaste must be used within a CopyPasteProvider')
  }
  return context
}
