import {useCallback, useState} from 'react'

import {useTaskOperations} from './useTaskOperations'

interface RemoveTaskOptions {
  id: string
  onError?: (message: string) => void
  onRemoved?: () => void
}

interface RemoveTasksHookValue {
  removeStatus: 'idle' | 'loading' | 'error'
  showDialog: boolean
  error: string | null
  handleRemove: () => void
  handleOpenDialog: () => void
  handleCloseDialog: () => void
}

export function useRemoveTask({id, onError, onRemoved}: RemoveTaskOptions): RemoveTasksHookValue {
  const [removeStatus, setRemoveStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [showDialog, setShowDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const operations = useTaskOperations()

  const handleRemove = useCallback(async () => {
    try {
      setRemoveStatus('loading')
      await operations.remove(id)
      onRemoved?.()
      setRemoveStatus('idle')
      await new Promise((resolve) => setTimeout(resolve, 300))
      setShowDialog(false)
    } catch (e) {
      onError?.(e.message)
      setError(e.message)
      setRemoveStatus('error')
    } finally {
      setRemoveStatus('idle')
    }
  }, [id, operations, onError, onRemoved])

  const handleOpenDialog = useCallback(() => {
    setShowDialog(true)
  }, [setShowDialog])
  const handleCloseDialog = useCallback(() => {
    setShowDialog(false)
  }, [setShowDialog])

  return {
    removeStatus,
    showDialog,
    error,
    handleRemove,
    handleOpenDialog,
    handleCloseDialog,
  }
}
