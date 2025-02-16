import DialogTimeZone from '../components/dialogs/DialogTimeZone'
import {useDialogVisible} from './useDialogVisibile'
import {type TimeZoneScope} from './useTimeZone'

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
