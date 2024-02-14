import {Checkbox, Flex, Spinner} from '@sanity/ui'
import {useTasks} from '../../context'
import React, {useCallback, useState} from 'react'

interface TasksStatusProps {
  documentId: string
}

export function TasksStatus(props: TasksStatusProps) {
  const {operations, isLoading} = useTasks()

  const {documentId} = props
  const [checkboxValue, setCheckboxValue] = useState(false)

  const checkboxValues = [
    {name: 'open', label: 'To do'},
    {name: 'closed', label: 'Done'},
  ]

  //Sort it todo and done
  const handleCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked
      setCheckboxValue(isChecked)

      if (isChecked) {
        operations.edit(documentId, {status: 'closed'})
      } else {
        operations.edit(documentId, {status: 'open'})
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
