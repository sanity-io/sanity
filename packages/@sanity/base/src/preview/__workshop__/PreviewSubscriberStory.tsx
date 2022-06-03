import {SortOrdering} from '@sanity/types'
import {Card, Code, Text} from '@sanity/ui'
import {useSelect} from '@sanity/ui-workshop'
import React, {useCallback, useMemo} from 'react'
import {useSource} from '../../studio'
import {PreviewSubscriber, PreviewSubscriberProps} from '../components/PreviewSubscriber'
import {WORKSHOP_PREVIEW_LAYOUT} from './constants'

export default function PreviewSubscriberStory() {
  const layout = useSelect('Layout', WORKSHOP_PREVIEW_LAYOUT, 'default')
  const {schema} = useSource()
  const documentValue = useMemo(() => ({_type: 'author', _id: 'grrm'}), [])
  const schemaType = schema.get('author')!
  const ordering: SortOrdering = useMemo(
    () => ({title: 'By name', by: [{field: 'name', direction: 'asc'}]}),
    []
  )

  const renderChildren: PreviewSubscriberProps['children'] = useCallback(
    ({error, isLoading, layout: _layout, schemaType: _schemaType, snapshot}) => {
      if (error) {
        return (
          <Card padding={3} tone="critical">
            <Text size={1}>Error: {error.message}</Text>
          </Card>
        )
      }

      if (isLoading) {
        return (
          <Card padding={3} tone="transparent">
            <Text size={1}>Loading…</Text>
          </Card>
        )
      }

      return (
        <Card padding={3} tone="transparent">
          <Code language="json" size={1}>
            {JSON.stringify({type: _schemaType.name, layout: _layout, snapshot}, null, 2)}
          </Code>
        </Card>
      )
    },
    []
  )

  return (
    <PreviewSubscriber
      layout={layout}
      ordering={ordering}
      schemaType={schemaType}
      value={documentValue}
    >
      {renderChildren}
    </PreviewSubscriber>
  )
}
