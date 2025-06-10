import DialogTimeZone from '../components/timeZone/DialogTimeZone'
import {useDialogVisible} from './useDialogVisibile'
import {type TimeZoneScope} from './useTimeZone'

/**
 * @internal
 */
export const useDialogTimeZone = (timeZoneScope: TimeZoneScope) => {
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
