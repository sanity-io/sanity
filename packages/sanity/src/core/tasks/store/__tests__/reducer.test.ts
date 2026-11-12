import {describe, expect, it} from 'vitest'

import {task} from '../../../store/addonDatasetListener/__fixtures__/addonDataset.fixture'
import {tasksReducer, type TasksReducerState} from '../reducer'

describe('tasksReducer', () => {
  it('keeps the same state when the deleted task is not in the store', () => {
    const state: TasksReducerState = {tasks: {'t-1': task('t-1')}}

    expect(tasksReducer(state, {type: 'TASK_DELETED', id: 'c-1'})).toBe(state)
  })

  it('deletes a task', () => {
    const state: TasksReducerState = {tasks: {'t-1': task('t-1'), 't-2': task('t-2')}}

    expect(Object.keys(tasksReducer(state, {type: 'TASK_DELETED', id: 't-1'}).tasks)).toEqual([
      't-2',
    ])
  })
})
