import DialogTimeZone from '../components/timeZone/DialogTimeZone'
import {type TimeZoneScope} from './useTimeZone'
import {useCallback, useState} from 'react'

function useDialogTimeZone(timeZoneScope: TimeZoneScope) {
  const [visible, setVisible] = useState(false)

  const hide = useCallback(() => {
    setVisible(false)
  }, [])
  const show = useCallback(() => {
    setVisible(true)
  }, [])

  const dialogProps = {
    onClose: hide,
    visible,
    timeZoneScope,
  }

  return {
    DialogTimeZone: visible ? DialogTimeZone : null,
    dialogProps,
    timeZoneScope,
    dialogTimeZoneShow: show,
    hide,
  }
}

export default useDialogTimeZone
