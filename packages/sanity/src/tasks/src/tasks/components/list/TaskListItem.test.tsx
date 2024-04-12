import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, render} from '@testing-library/react'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {TasksListItem} from './TasksListItem'

const mockedEditFn = jest.fn()
jest.mock('../../hooks/useTaskOperations', () => ({
  useTaskOperations: jest.fn(() => ({
    edit: mockedEditFn,
  })),
}))

describe('Tests TaskListItem', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })
  it('should change the status of the task when clicking the checkbox', async () => {
    const wrapper = await createTestProvider()
    const onSelect = jest.fn()
    const taskListItemProps = {
      documentId: '91ea0763-2620-4746-b2a2-5294dcacf29e',
      title: 'Test task 29',
      status: 'open' as const,
    }
    const component = render(<TasksListItem {...taskListItemProps} onSelect={onSelect} />, {
      wrapper,
    })
    const checkbox = component.getByRole('checkbox')
    await act(async () => {
      checkbox.click()
    })
    expect(mockedEditFn).toHaveBeenCalledWith(taskListItemProps.documentId, {status: 'closed'})

    component.rerender(
      <TasksListItem {...taskListItemProps} status={'closed'} onSelect={onSelect} />,
    )
    const checkboxClosed = component.getByRole('checkbox')
    await act(async () => {
      checkboxClosed.click()
    })
    expect(mockedEditFn).toHaveBeenCalledWith(taskListItemProps.documentId, {status: 'open'})
  })
})
