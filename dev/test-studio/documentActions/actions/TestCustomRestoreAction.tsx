import {RocketIcon} from '@sanity/icons'
import {type DocumentActionComponent} from 'sanity'

export const TestCustomRestoreAction: (
  action: DocumentActionComponent,
) => DocumentActionComponent = (restoreAction) => {
  const action: DocumentActionComponent = (props) => ({
    ...restoreAction(props),
    label: 'Custom restore',
    tone: 'positive',
    icon: RocketIcon,
  })

  action.action = 'restore'
  return action
}
