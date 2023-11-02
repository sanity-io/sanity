import {Box} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {DiffErrorBoundary} from '../diff/components/DiffErrorBoundary'
import {Button} from '../../../ui'

export default function DiffErrorBoundaryStory() {
  return (
    <Box padding={4}>
      <DiffErrorBoundary>
        <Test />
      </DiffErrorBoundary>
    </Box>
  )
}

function Test() {
  const [error, setError] = useState('')

  const handleClick = useCallback(() => {
    setError('throw')
  }, [])

  if (error) {
    throw new Error('Throw!')
  }

  return <Button onClick={handleClick} text="Throw" />
}
