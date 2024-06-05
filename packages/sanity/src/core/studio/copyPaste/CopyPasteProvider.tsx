import {type ReactNode, useCallback, useContext, useMemo, useRef, useState} from 'react'
import {getPublishedId} from 'sanity'
import {CopyPasteContext} from 'sanity/_singletons'

import {type CopyActionResult, type DocumentMeta} from './types'

/**
 * @beta
 * @hidden
 */
export const CopyPasteProvider: React.FC<{
  children: ReactNode
}> = ({children}) => {
  const documentMetaRef = useRef<DocumentMeta | null>(null)
  const [copyResult, setCopyResult] = useState<CopyActionResult | null>(null)

  const isValidTargetType = useCallback(
    (target: string) => {
      const source = copyResult?.schemaTypeName
      return source === target
    },
    [copyResult],
  )

  const setDocumentMeta = useCallback(
    ({documentId, documentType, schemaType, onChange}: Required<DocumentMeta>) => {
      documentMetaRef.current = {
        documentId: getPublishedId(documentId),
        documentType,
        schemaType,
        onChange,
      }
    },
    [],
  )

  const getDocumentMeta = useCallback(() => documentMetaRef.current, [])

  const contextValue = useMemo(
    () => ({
      copyResult,
      onChange: documentMetaRef?.current?.onChange,
      getDocumentMeta,
      setCopyResult,
      setDocumentMeta,
      isValidTargetType,
    }),
    [copyResult, getDocumentMeta, setDocumentMeta, isValidTargetType],
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
