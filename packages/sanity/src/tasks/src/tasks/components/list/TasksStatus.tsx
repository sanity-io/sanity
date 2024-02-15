import {Checkbox, Flex, Spinner} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {useTasks} from '../../context'

interface TasksStatusProps {
  documentId: string
  status?: string
}

export function TasksStatus(props: TasksStatusProps) {
  const {operations} = useTasks()
  const {documentId, status} = props

  const [checkboxValue, setCheckboxValue] = useState(status === 'closed')
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckboxChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked
      setCheckboxValue(isChecked)
      setIsLoading(true)

      try {
        if (isChecked) {
          await operations.edit(documentId, {status: 'closed'})
        } else if (!isChecked) {
          await operations.edit(documentId, {status: 'open'})
        }
      } catch (error) {
        console.error('An error occurred while updating the task status', error)
      } finally {
        setIsLoading(false)
      }
    },
    [documentId, operations],
  )

  return (
    <Flex paddingRight={2}>
      {isLoading ? (
        <Spinner />
      ) : (
        <Checkbox onChange={handleCheckboxChange} checked={checkboxValue} disabled={isLoading} />
      )}
    </Flex>
  )
}
