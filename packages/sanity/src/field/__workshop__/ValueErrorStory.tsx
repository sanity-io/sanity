import {Box} from '@sanity/ui'
import {useText} from '@sanity/ui-workshop'
import React, {useMemo} from 'react'
import {ValueError} from '../diff/components/ValueError'

export default function ValueErrorStory() {
  const message = useText('Message', 'Error message')!
  const error = useMemo(() => ({message, value: 123}), [message])

  return (
    <Box padding={4}>
      <ValueError error={error} />
    </Box>
  )
}
