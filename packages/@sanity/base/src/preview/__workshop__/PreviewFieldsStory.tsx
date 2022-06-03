import {Card, Code} from '@sanity/ui'
import React, {useMemo} from 'react'
import {useSource} from '../../studio'
import {PreviewFields} from '../components/PreviewFields'

export default function PreviewFieldsStory() {
  const {schema} = useSource()
  const documentValue = useMemo(() => ({_type: 'author', _id: 'grrm'}), [])
  const schemaType = schema.get(documentValue._type)!

  return (
    <PreviewFields value={documentValue} schemaType={schemaType}>
      {(value) => (
        <Card padding={3} tone="transparent">
          <Code language="json" size={1}>
            {JSON.stringify(value, null, 2)}
          </Code>
        </Card>
      )}
    </PreviewFields>
  )
}
