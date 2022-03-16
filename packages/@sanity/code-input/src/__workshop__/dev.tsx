import {FormFieldPresence} from '@sanity/base/presence'
import {Path} from '@sanity/types'
import {Box} from '@sanity/ui'
import {useAction} from '@sanity/ui-workshop'
import React, {useState} from 'react'
import CodeInput from '../CodeInput'
import type from '../schema'

export default function DevStory() {
  const [focusPath] = useState<Path>([])
  const onBlur = useAction('onBlur')
  const onChange = useAction('onChange')
  const onFocus = useAction('onFocus')
  const [presence] = useState<FormFieldPresence[]>([])

  return (
    <Box padding={4}>
      <CodeInput
        focusPath={focusPath}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        presence={presence}
        type={type}
      />
    </Box>
  )
}
