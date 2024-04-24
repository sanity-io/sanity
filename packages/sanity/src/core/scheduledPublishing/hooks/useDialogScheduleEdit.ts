import DialogScheduleEdit from '../components/dialogs/DialogScheduleEdit'
import {type Schedule} from '../types'
import {useDialogVisible} from './useDialogVisibile'

function useDialogScheduleEdit(schedule: Schedule) {
  const {visible, show, hide} = useDialogVisible()

  const dialogProps = {
    onClose: hide,
    schedule,
    visible,
  }

  return {
    DialogScheduleEdit: visible ? DialogScheduleEdit : null,
    dialogProps,
    dialogScheduleEditShow: show,
    hide,
  }
}

export default useDialogScheduleEdit
