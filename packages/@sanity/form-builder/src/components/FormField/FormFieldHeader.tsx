import React from 'react'
import {Box, Flex} from '@sanity/ui'
import {Marker} from '@sanity/types'
import {FormFieldHeaderText} from './FormFieldHeaderText'

interface FormFieldHeaderProps {
  description?: React.ReactNode
  htmlFor?: string
  markers?: Marker[]
  presence?: React.ReactNode
  title?: React.ReactNode
}

export function FormFieldHeader(props: FormFieldHeaderProps) {
  const {description, htmlFor, markers, presence, title} = props

  return (
    <Flex align="flex-end">
      <Box flex={1} paddingY={2}>
        <FormFieldHeaderText
          description={description}
          htmlFor={htmlFor}
          markers={markers}
          title={title}
        />
      </Box>

      {presence && <Box>{presence}</Box>}
    </Flex>
  )
}
