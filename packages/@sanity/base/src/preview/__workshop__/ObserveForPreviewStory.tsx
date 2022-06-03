import {Card, Code, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useSource} from '../../studio'
import {ObserveForPreview, ObserveForPreviewProps} from '../components/ObserveForPreview'

export default function ObserveForPreviewStory() {
  const {schema} = useSource()
  const authorType = schema.get('author')!

  const renderChildren: ObserveForPreviewProps['children'] = useCallback(
    ({error, isLoading, result}) => {
      if (error) {
        return (
          <Card padding={3} tone="critical">
            <Text size={1}>Error: {error.message}</Text>
          </Card>
        )
      }

      if (isLoading) {
        return (
          <Card padding={3}>
            <Text size={1}>Loading…</Text>
          </Card>
        )
      }

      return (
        <Card padding={3} tone="transparent">
          <Code language="json" size={1}>
            {JSON.stringify(result.snapshot, null, 2)}
          </Code>
        </Card>
      )
    },
    []
  )

  return (
    <ObserveForPreview isActive schemaType={authorType} value={{_id: 'grrm'}}>
      {renderChildren}
    </ObserveForPreview>
  )
}
