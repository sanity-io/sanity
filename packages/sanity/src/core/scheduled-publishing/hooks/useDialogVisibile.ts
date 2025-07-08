import {useCallback, useState} from 'react'

import {type TimeZoneScope} from '../../hooks/useTimeZone'

interface DialogControls {
  show: () => void
  hide: () => void
  timeZoneScope: TimeZoneScope
  visible: boolean
}

export function useDialogVisible(timeZoneScope: TimeZoneScope): DialogControls {
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
    timeZoneScope,
    hide,
  }
}
