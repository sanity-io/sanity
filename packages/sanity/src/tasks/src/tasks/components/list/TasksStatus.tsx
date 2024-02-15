import {Checkbox, Flex, Spinner} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {useTasks} from '../../context'

interface TasksStatusProps {
  documentId: string
  status?: string
}

export function TasksStatus(props: TasksStatusProps) {
  const {operations, isLoading} = useTasks()
  const {documentId, status} = props

  const [checkboxValue, setCheckboxValue] = useState(status === 'closed')

  const handleCheckboxChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked
      setCheckboxValue(isChecked)

      try {
        if (isChecked) {
          await operations.edit(documentId, {status: 'closed'})
        } else if (!isChecked) {
          await operations.edit(documentId, {status: 'open'})
        }
      } catch (error) {
        console.error('An error occurred while updating the task status', error)
      }
    },
    [documentId, operations],
  )

  return isLoading ? (
    <Flex paddingRight={2}>
      <Spinner />
    </Flex>
  ) : (
    <Flex paddingRight={2}>
      <Checkbox onChange={handleCheckboxChange} checked={checkboxValue} />
    </Flex>
  )
}
