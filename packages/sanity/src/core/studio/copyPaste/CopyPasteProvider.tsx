import {useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useContext, useEffect, useRef, useState} from 'react'
import {CopyPasteContext} from 'sanity/_singletons'
import {useDocumentPane} from 'sanity/structure'

import {BROADCAST_CHANNEL_NAME} from './constants'
import {type CopyActionResult} from './types'
import {getClipboardItem} from './utils'

/**
 * @beta
 * @hidden
 */
export const CopyPasteProvider: React.FC<{
  children: ReactNode
  documentId?: string
  documentType?: string
}> = ({documentId, documentType, children}) => {
  const [copyResult, setCopyResult] = useState<CopyActionResult | null>(null)
  const [isCopyResultInClipboard, setIsCopyResultInClipboard] = useState<boolean | null>(null)
  const {onChange} = useDocumentPane()
  const toast = useToast()
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)

  // create a isValidTargetType function that checks if source and target schemaType is the same
  const isValidTargetType = useCallback(
    (target: string) => {
      // source should be pulled from copyResult, if set
      const source = copyResult?.schemaTypeName
      return source === target
    },
    [copyResult],
  )

  const refreshCopyResult = useCallback(async () => {
    const storedCopyResult = await getClipboardItem()
    setIsCopyResultInClipboard(!!storedCopyResult)
  }, [])

  useEffect(() => {
    const broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    broadcastChannelRef.current = broadcastChannel

    const handleMessage = (event: MessageEvent) => {
      setCopyResult(event.data)
      toast.push({
        status: 'info',
        title: 'Copy data synchronized across tabs',
      })
    }

    broadcastChannel.addEventListener('message', handleMessage)

    return () => {
      broadcastChannel.removeEventListener('message', handleMessage)
      broadcastChannel.close()
    }
  }, [toast])

  const sendMessage = useCallback((message: CopyActionResult) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage(message)
    }
  }, [])

  useEffect(() => {
    refreshCopyResult()
  })

  useEffect(() => {
    setIsCopyResultInClipboard(!!copyResult)
  }, [copyResult])

  const contextValue = {
    copyResult,
    documentId,
    documentType,
    setCopyResult,
    sendMessage,
    onChange,
    refreshCopyResult,
    isValidTargetType,
    isCopyResultInClipboard,
  }

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
