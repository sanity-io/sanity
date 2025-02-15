import DialogTimeZone from '../components/dialogs/DialogTimeZone'
import {useDialogVisible} from './useDialogVisibile'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function useDialogTimeZone(inputId?: string, defaultTimezone?: string) {
  const {visible, show, hide} = useDialogVisible(inputId)

  const dialogProps = {
    onClose: hide,
    visible,
    inputId,
    defaultTimezone,
  }

  return {
    DialogTimeZone: visible ? DialogTimeZone : null,
    dialogProps,
    inputId,
    defaultTimezone,
    dialogTimeZoneShow: show,
    hide,
  }
}

export default useDialogTimeZone
