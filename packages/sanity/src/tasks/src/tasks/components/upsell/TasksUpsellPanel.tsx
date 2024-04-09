import {CommentsUpsellPanel} from '../../../../../structure/comments'
import {useTasksUpsell} from '../../context/upsell'

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
