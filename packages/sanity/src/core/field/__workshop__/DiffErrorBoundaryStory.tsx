import {Box} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {DiffErrorBoundary} from '../diff/components/DiffErrorBoundary'
import {Button} from '../../../ui'
import {useTranslation} from '../../i18n'

export default function DiffErrorBoundaryStory() {
  const {t} = useTranslation()
  return (
    <Box padding={4}>
      <DiffErrorBoundary t={t}>
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
