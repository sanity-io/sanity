import {useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useContext, useEffect, useRef, useState} from 'react'
import {useProjectId} from 'sanity'
import {CopyPasteContext} from 'sanity/_singletons'
import {useDocumentPane} from 'sanity/structure'

import {BROADCAST_CHANNEL_NAME} from './constants'
import {type CopyActionResult} from './types'
import {getLocalStorageItem, getLocalStorageKey} from './utils'

export const CopyPasteProvider: React.FC<{
  children: ReactNode
}> = ({children}) => {
  const projectId = useProjectId()
  const [copyResult, setCopyResult] = useState<CopyActionResult | null>(null)
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
    const storedCopyResult = getLocalStorageItem(getLocalStorageKey(projectId))
    if (storedCopyResult) {
      setCopyResult(storedCopyResult)
    }
  }, [projectId])

  const contextValue = {
    copyResult,
    setCopyResult,
    sendMessage,
    onChange,
    isValidTargetType,
  }

  return <CopyPasteContext.Provider value={contextValue}>{children}</CopyPasteContext.Provider>
}

export const useCopyPaste = () => {
  const context = useContext(CopyPasteContext)
  if (!context) {
    throw new Error('useCopyPaste must be used within a CopyPasteProvider')
  }
  return context
}
