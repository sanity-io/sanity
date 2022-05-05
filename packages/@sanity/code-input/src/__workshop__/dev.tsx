import {createSchema} from '@sanity/base/_unstable'
import {ValidationMarker, Path} from '@sanity/types'
import {Box} from '@sanity/ui'
import {useAction} from '@sanity/ui-workshop'
import React, {useState} from 'react'
import {CodeInput, CodeSchemaType} from '../CodeInput'
import typeDef from '../schema'

const schema = createSchema({name: 'dev', types: [typeDef]})
const type = schema.get('code') as CodeSchemaType

export default function DevStory() {
  const [focusPath] = useState<Path>([])
  const [validation] = useState<ValidationMarker[]>([])
  const onBlur = useAction('onBlur')
  const onChange = useAction('onChange')
  const onFocus = useAction('onFocus')
  const [presence] = useState<any[]>([])

  return (
    <Box padding={4}>
      <>TODO</>
      {/* <CodeInput
        focusPath={focusPath}
        level={0}
        validation={validation}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        presence={presence}
        type={type}
      /> */}
    </Box>
  )
}
