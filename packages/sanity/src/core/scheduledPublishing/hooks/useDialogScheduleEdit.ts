import DialogScheduleEdit from '../components/dialogs/DialogScheduleEdit'
import {type Schedule} from '../types'
import {useDialogVisible} from './useDialogVisibile'
import {type TimeZoneScope} from './useTimeZone'

function useDialogScheduleEdit(schedule: Schedule, tzScope: TimeZoneScope) {
  const {visible, show, hide, timeZoneScope} = useDialogVisible(tzScope)

  const dialogProps = {
    onClose: hide,
    schedule,
    visible,
  }

  return {
    DialogScheduleEdit: visible ? DialogScheduleEdit : null,
    dialogProps,
    timeZoneScope,
    dialogScheduleEditShow: show,
    hide,
  }
}

export default useDialogScheduleEdit
