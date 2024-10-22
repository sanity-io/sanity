import {describe, expect, it} from 'vitest'

import {type DocumentActionComponent} from '../../document/actions'
import {
  getStartInCreateSortedActions,
  START_IN_CREATE_ACTION_NAME,
} from '../startInCreateSortedActions'

describe('getStartInCreateSortedActions', () => {
  it(`puts Start in Create action first`, async () => {
    const StartInCreateAction: DocumentActionComponent = () => {
      return null
    }
    StartInCreateAction.action = START_IN_CREATE_ACTION_NAME

    const Action1: DocumentActionComponent = () => {
      return null
    }
    const Action2: DocumentActionComponent = () => {
      return null
    }

    const actions = [Action1, Action2, StartInCreateAction]
    const sortedActions = getStartInCreateSortedActions(actions)
    expect(sortedActions).toEqual([StartInCreateAction, Action1, Action2])
  })
})
