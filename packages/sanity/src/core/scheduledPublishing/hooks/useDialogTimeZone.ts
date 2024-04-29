import DialogTimeZone from '../components/dialogs/DialogTimeZone'
import {useDialogVisible} from './useDialogVisibile'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function useDialogTimeZone() {
  const {visible, show, hide} = useDialogVisible()

  const dialogProps = {
    onClose: hide,
    visible,
  }

  return {
    DialogTimeZone: visible ? DialogTimeZone : null,
    dialogProps,
    dialogTimeZoneShow: show,
    hide,
  }
}

export default useDialogTimeZone
