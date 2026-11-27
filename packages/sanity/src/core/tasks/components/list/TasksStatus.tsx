import {Checkbox} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {Spinner, Flex} from 'ui5'

import {useTaskOperations} from '../../hooks/useTaskOperations'

interface TasksStatusProps {
  documentId: string
  status?: string
}

export function TasksStatus(props: TasksStatusProps) {
  const operations = useTaskOperations()
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
      }
      setIsLoading(false)
    },
    [documentId, operations],
  )

  return (
    <Flex>
      {isLoading ? (
        // Matches the 17px checkbox so the row doesn't shift while the status updates
        <div style={{height: '17px', width: '17px'}}>
          <Spinner style={{fontSize: '20px', margin: '-1.5px'}} />
        </div>
      ) : (
        <Checkbox onChange={handleCheckboxChange} checked={checkboxValue} disabled={isLoading} />
      )}
    </Flex>
  )
}
