import {ChangeIndicator, ChangeIndicatorContextProvidedProps} from '@sanity/base/components'
import {FieldPresence, FormFieldPresence} from '@sanity/base/presence'
import {Marker} from '@sanity/types'
import {Stack} from '@sanity/ui'
import React from 'react'
import {FormFieldHeader} from './FormFieldHeader'

interface FormFieldProps {
  changeIndicator?: ChangeIndicatorContextProvidedProps | boolean
  children: React.ReactNode
  description?: React.ReactNode
  htmlFor?: string
  level?: number
  markers?: Marker[]
  title?: React.ReactNode
  // @todo: Turn `presence` into a React.ReactNode property?
  // presence?: React.ReactNode
  presence?: FormFieldPresence[]
  // @todo: Take list of validation items instead of raw markers?
  // validation?: FormFieldValidation[]
}

export function FormField(props: FormFieldProps) {
  const {
    changeIndicator = true,
    children,
    description,
    htmlFor,
    level,
    markers,
    title,
    presence = [],
  } = props

  let content = children

  if (changeIndicator) {
    content = <ChangeIndicator {...changeIndicator}>{children}</ChangeIndicator>
  }

  return (
    <Stack data-level={level} space={1}>
      <FormFieldHeader
        description={description}
        htmlFor={htmlFor}
        markers={markers}
        presence={<FieldPresence maxAvatars={4} presence={presence} />}
        title={title}
      />
      <div>{content}</div>
    </Stack>
  )
}
