import {EllipsisVerticalIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import React from 'react'
import {FieldProps} from 'sanity'
import {useDocumentPane} from 'sanity/desk'

export function FormField(props: FieldProps) {
  const {documentType} = useDocumentPane()

  if (documentType === 'fieldActionsTest') {
    return props.renderDefault({
      ...props,
      actions: (
        <Button fontSize={1} icon={EllipsisVerticalIcon} mode="bleed" padding={2} tabIndex={-1} />
      ),
    })
  }

  return props.renderDefault(props)
}
