import {SparklesIcon} from '@sanity/icons'
import {Button, Card, Flex} from '@sanity/ui'
import React, {useCallback} from 'react'
import {FieldProps} from 'sanity'

export function CustomTitleField(props: FieldProps) {
  const renderActions = useCallback<NonNullable<FieldProps['internal_renderActions']>>(() => {
    return (
      <Flex justify="flex-end" style={{width: '100%'}}>
        <Button disabled fontSize={1} icon={SparklesIcon} padding={2} />
      </Flex>
    )
  }, [])

  return (
    <Card padding={1} tone="caution">
      {props.renderDefault({
        ...props,
        // eslint-disable-next-line camelcase
        internal_renderActions: renderActions,
      })}
    </Card>
  )
}
