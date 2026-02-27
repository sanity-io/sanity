import {RocketIcon} from '@sanity/icons'
import {memoize} from 'lodash-es'
import {type DocumentActionComponent} from 'sanity'

export const createTestCustomRestoreAction: (
  useOriginalAction: DocumentActionComponent,
) => DocumentActionComponent = memoize(function createCustomRestoreAction(useOriginalAction) {
  const useCustomRestoreAction: DocumentActionComponent = (props) => {
    const state = useOriginalAction(props)
    return {...state, label: 'Custom restore', tone: 'positive', icon: RocketIcon}
  }

  useCustomRestoreAction.action = useOriginalAction.action
  useCustomRestoreAction.displayName = 'CustomRestoreAction'
  return useCustomRestoreAction
})
