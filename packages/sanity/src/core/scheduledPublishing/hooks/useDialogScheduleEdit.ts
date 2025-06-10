import {type TimeZoneScope} from '../../hooks/useTimeZone'
import {type Schedule} from '../../studio/timezones/types'
import DialogScheduleEdit from '../components/dialogs/DialogScheduleEdit'
import {useDialogVisible} from './useDialogVisibile'

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
