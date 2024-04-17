import {CommentsUpsellPanel} from '../../../comments'
import {useTasksUpsell} from '../../context'

export function TasksUpsellPanel() {
  const {
    upsellData: data,
    telemetryLogs: {panelPrimaryClicked: onPrimaryClick, panelSecondaryClicked: onSecondaryClick},
  } = useTasksUpsell()

  if (!data) return null
  return (
    <CommentsUpsellPanel
      data={data}
      onPrimaryClick={onPrimaryClick}
      onSecondaryClick={onSecondaryClick}
    />
  )
}
