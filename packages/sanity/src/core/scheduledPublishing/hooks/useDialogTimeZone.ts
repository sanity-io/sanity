import DialogTimeZone from '../../components/timeZone/DialogTimeZone'
import {type TimeZoneScope} from '../../hooks/useTimeZone'
import {useDialogVisible} from './useDialogVisibile'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function useDialogTimeZone(timeZoneScope: TimeZoneScope) {
  const {visible, show, hide} = useDialogVisible(timeZoneScope)

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
