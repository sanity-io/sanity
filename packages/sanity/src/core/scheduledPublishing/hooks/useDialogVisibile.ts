import {useCallback, useState} from 'react'

interface DialogControls {
  show: () => void
  hide: () => void
  visible: boolean
}

export function useDialogVisible(): DialogControls {
  const [dialogVisible, setDialogVisible] = useState(false)

  const hide = useCallback(() => {
    setDialogVisible(false)
  }, [])
  const show = useCallback(() => {
    setDialogVisible(true)
  }, [])

  return {
    visible: dialogVisible,
    show,
    hide,
  }
}
